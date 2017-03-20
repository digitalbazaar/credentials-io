/**
 * A JavaScript API for transmitting and verifying Credentials.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * * Neither the name of Digital Bazaar, Inc. nor the names of its contributors
 *   may be used to endorse or promote products derived from this software
 *   without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
var _ = require('lodash');
var async = require('async');
var request = require('request');

/**
 * Attaches the API to the given object.
 *
 * @param api the object to attach the API to.
 */
function wrap(api) {

var libs = {};

// constants
var IDENTITY_CONTEXT_URL = 'https://w3id.org/identity/v1';
var IDENTITY_FRAME = {
  '@context': IDENTITY_CONTEXT_URL,
  type: 'Identity'
};

/**
 * Allows injectables to be set or retrieved.
 *
 * @param name the name of the injectable to use (
 *          eg: `jsonld`, `jsonld-signatures`).
 * @param [injectable] the api to set for the injectable, only present for setter,
 *          omit for getter.
 * @param [options] the options to use:
 *          [configure] by default, this library will auto-configure certain
 *            passed injectables (eg: jsonld) to enable features like DID-based
 *            URL resolution; to disable this feature, set `configure` to false.
 *
 * @return the API for `name` if not using this method as a setter, otherwise
 *   undefined.
 */
api.use = function(name, injectable, options) {
  options = options || {};

  // initialize lib entry
  if(!libs[name]) {
    libs[name] = {
      api: null,
      // if `options.configure` is false, set lib as already configured
      // otherwise set as unconfigured and configure on first use later
      configured: ('configure' in options ? !options.configure : false)
    };
  }

  // setter mode
  if(injectable) {
    libs[name].api = injectable;
    return;
  }

  // getter mode:

  // api not yet set, load default
  if(!libs[name].api) {
    libs[name].api = require(name);
    if(name === 'jsonld') {
      // locally configure jsonld
      // Note: this configuration is necessary as a basic setup of `jsonld`
      // in a secure mode, it is not the same as later configuration required
      // for use by this library
      libs[name].api = libs[name].api();
      libs[name].api.useDocumentLoader('node', {secure: true, strictSSL: true});
    }
  }

  // ensure api is configured before returning it
  if(!libs[name].configured) {
    // mark library as configured immediately to avoid circular dependency
    // issues
    libs[name].configured = true;
    if(name === 'did-io' || name === 'jsonld-signatures') {
      libs[name].api.use('jsonld', api.use('jsonld'));
      if(name === 'did-io') {
        libs[name].api.use('jsonld-signatures', api.use('jsonld-signatures'));
      }
    } else if(name === 'jsonld') {
      // wrap document loader w/DID-based loader
      libs[name].api.documentLoader = api.use('did-io').createDocumentLoader({
        wrap: libs[name].api.documentLoader
      });
    }
  }
  return libs[name].api;
};

/**
 * Verifies the digital signature on the given Identity object and any
 * credentials it contains. This call only checks authenticity, it does not
 * check a trust store for the identities used to sign.
 *
 * TODO: This call should accept a function for checking trusted identities,
 * domains, etc., so these things can be checked prior to normalization.
 *
 * The callback will be passed the following object:
 *
 * {
 *   verified: <true/false>,
 *   identity: <framed identity>,
 *   domain: <domain the signature was signed for>,
 *   publicKey: <public key object for the creator of the signature>,
 *   publicKeyOwner: <identity object for the creator of the signature>,
 *   // a map of verified objects for each credential (ID => verified)
 *   credentials: {}
 * }
 *
 * @param identity the identity to check.
 * @param options the options to use:
 *          [checkTimestamp]: check signature timestamp (default: true) on
 *            the main Identity credential.
 *          [maxTimestampDelta]: signature must be created within a window of
 *            this many seconds (default: 15 minutes).
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, result) called once the operation completes.
 */
api.verify = function(identity, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  var jsonld = api.use('jsonld');
  var jsigs = api.use('jsonld-signatures');

  // TODO: assume identity is already properly framed prior to consumption;
  // this is a temporary requirement until jsonld.js supports named graph
  // framing

  // TODO: move any of opencred-verifier code here?
  var result = {
    credentials: {}
  };

  async.auto({
    frame: function(callback) {
      return callback(null, identity);
      /*
      jsonld.frame(
        identity, IDENTITY_FRAME, function(err, framed) {
          if(err) {
            return callback(err);
          }
          var id = framed['@graph'][0];
          if(!id) {
            return callback(new Error('Unknown Identity format.'));
          }
          id['@context'] = framed['@context'];
          callback(null, id);
        });*/
    },
    verifyCredentials: ['frame', function(callback, results) {
      result.identity = results.frame;
      var credentials = jsonld.getValues(result.identity, 'credential');
      async.forEach(credentials, function(credential, callback) {
        // FIXME:
        // original
        // credential = credential['@graph'];
        // new: @graph property can be an array or an object
        credential = Array.isArray(credential['@graph']) ?
          credential['@graph'][0] : credential['@graph'];
        credential['@context'] = results.frame['@context'];
        // TODO: deal with case where `credential.id` is undefined or
        // a duplicate
        var res = result.credentials[credential.id] = {};
        var opts = _.assign(options, {
          id: credential.id,
          checkDomain: checkDomain(res),
          checkKeyOwner: checkKeyOwner(res)
        });
        jsigs.verify(credential, opts, function(err, verified) {
          res.verified = !err && verified;
          callback(err, res);
        });
      }, callback);
    }],
    getIdpSignedPublicKey: ['verifyCredentials', function(callback) {
      getIdpSignedPublicKey(result, callback);
    }],
    verifyIdentity: ['getIdpSignedPublicKey', function(callback, results) {
      var opts = _.assign({
        id: result.identity.id,
        checkTimestamp: true
      }, options, {
        checkDomain: checkDomain(result),
        checkKeyOwner: checkKeyOwner(result)
      });
      if(results.getIdpSignedPublicKey) {
        opts.publicKeyOwner = results.getIdpSignedPublicKey.publicKeyOwner;
        opts.publicKey = results.getIdpSignedPublicKey.publicKey;
      }
      jsigs.verify(result.identity, opts, function(err, verified) {
        result.verified = !err && verified;
        callback(err, result);
      });
    }]
  }, function(err) {
    callback(err, result);
  });
};

api.send = function(options, callback) {
  var url = options.url;
  var body = options.credential || options.query;
  var privateKeyPem = options.privateKeyPem;
  var publicKeyId = options.publicKeyId;
  var strictSSL = true;
  if('strictSSL' in options) {
    strictSSL = !!options.strictSSL;
  }

  var requestOptions = {
    url: url,
    body: body,
    json: true,
    httpSignature: {
      key: privateKeyPem,
      keyId: publicKeyId,
      headers: ['date', 'host', 'request-line']
    },
    strictSSL: strictSSL
  };

  request.post(requestOptions, callback);
};

// TODO: define a function for getting a public key via did-io

function checkDomain(result) {
  // TODO: check against some config value for the domain or similar
  return function(domain, options, callback) {
    result.domain = domain;
    return callback(null, true);
  };
}

function checkKeyOwner(result) {
  // TODO: check against a list of trusted owners, perhaps based on credential
  // type as well
  return function(owner, key, options, callback) {
    result.publicKey = key;
    result.publicKeyOwner = owner;
    return callback(null, true);
  };
}

function getIdpSignedPublicKey(result, callback) {
  var jsonld = api.use('jsonld');
  var identity = result.identity;
  async.auto({
    getIdentity: function(callback) {
      jsonld.documentLoader(identity.id, function(err, doc) {
        if(err) {
          err.status = err.httpStatusCode || 404;
          return callback(err);
        }
        doc = doc.document;
        if(typeof doc === 'string') {
          try {
            doc = JSON.parse(doc);
          } catch(e) {}
        }
        callback(null, doc);
      });
    },
    // TODO: frame identity
    getMatch: ['getIdentity', function(callback, results) {
      // scan list of credentials for a public key credential with a matching
      // ID that has been signed by the IdP for `identity.id`
      var creator = (identity.signature || {}).creator || '';
      var credentials = jsonld.getValues(identity, 'credential');
      for(var i = 0; i < credentials.length; ++i) {
        var credential = credentials[i]['@graph'];
        if(!jsonld.hasValue(credential, 'type', 'CryptographicKeyCredential')) {
          continue;
        }
        var publicKey = credential.claim.publicKey;
        // match found if public key ID matches creator of signature on
        // identity, credential is verified, and key owner ID is identity's IdP
        var res = result.credentials[credential.id];
        if(publicKey.id === creator && res.verified &&
          res.publicKeyOwner.id === results.getIdentity.idp) {
          jsonld.addValue(results.getIdentity, 'publicKey', publicKey.id);
          // ensure @context is passed on for key
          publicKey = _.assign({'@context': IDENTITY_CONTEXT_URL}, publicKey);
          return callback(null, publicKey);
        }
      }
      callback(null, null);
    }]
  }, function(err, results) {
    callback(err, results.getMatch ? {
      publicKeyOwner: results.getIdentity,
      publicKey: results.getMatch
    } : null);
  });
}

return api;

} // end wrap

// used to generate a new API instance
var factory = function(options) {
  return wrap(function() {return factory();}, options);
};
wrap(factory);

// module API
module.exports = factory;
