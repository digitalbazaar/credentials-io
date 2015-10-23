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
var libs = {};

// module API
var api = {};
module.exports = api;

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
    } else if(name === 'jsonld') {
      // wrap document loader w/DID-based loader
      libs[name].api.documentLoader = api.use('didio').createDocumentLoader({
        wrap: libs[name].api.documentLoader
      });
    }
  }
  return libs[name];
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
    verifyIdentity: ['frame', function(callback, results) {
      result.identity = results.frame;
      var opts = _.assign({
        id: results.frame.id,
        checkTimestamp: true
      }, options, {
        checkDomain: checkDomain(result),
        checkKeyOwner: checkKeyOwner(result)
      });
      jsigs.verify(results.identity, opts, function(err, verified) {
        result.verified = verified;
        callback(err, result);
      });
    }],
    verifyCredentials: ['verifyIdentity', function(callback, results) {
      var credentials = jsonld.getValues(results.identity, 'credential');
      async.forEach(credentials, function(credential, callback) {
        credential = credential['@graph'];
        credential['@context'] = results.frame['@context'];
        var res = result.credentials[credential.id] = {};
        var opts = _.assign(options, {
          id: credential.id,
          checkDomain: checkDomain(res),
          checkKeyOwner: checkKeyOwner(res)
        });
        jsigs.verify(credential, opts, function(err, verified) {
          res.verified = verified;
          callback(err, res);
        });
      }, callback);
    }]
  }, function(err) {
    callback(err, result);
  });
};

api.send = function(options, callback) {
  var url = options.url;
  var credential = options.credential;
  var privateKeyPem = options.privateKeyPem;
  var publicKeyId = options.publicKeyId;

  var requestOptions = {
    url: url,
    body: credential,
    json: true,
    httpSignature: {
      key: privateKeyPem,
      keyId: publicKeyId,
      headers: ['date', 'host', 'request-line']
    }
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
