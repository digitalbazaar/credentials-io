/**
 * Test runner for Credentials I/O library.
 *
 * @author Dave Longley <dlongley@digitalbazaar.com>
 * @author Manu Sporny <msporny@digitalbazaar.com>
 *
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 */
 /* jshint -W030 */
(function() {

'use strict';

// detect node.js (vs. phantomJS)
var _nodejs = (typeof process !== 'undefined' &&
  process.versions && process.versions.node);

var MOCK_DOCS = _mockDocs();

if(_nodejs) {
  var async = require('async');
  var uuid = require('node-uuid');
  var _jsdir = process.env.JSDIR || 'lib';
  var cio = require('../' + _jsdir + '/credentials-io');
  var program = require('commander');
  var should = require('chai').should();
  var jsonld = require('jsonld');
  var jsigs = require('jsonld-signatures')();
  var MOCK_DATA = require('./mock.data');
  cio.use('jsonld', jsonld);
  jsigs.use('jsonld', jsonld);

  var jsigsDocumentLoader = jsigs.use('jsonld').documentLoader;
  jsigs.use('jsonld').documentLoader = function(url, callback) {
    if(url in MOCK_DOCS) {
      return callback(
        null, {
          contextUrl: null,
          document: MOCK_DOCS[url],
          documentUrl: url
        });
    }
    jsigsDocumentLoader(url, callback);
  };

  // mock document loader
  var documentLoader = cio.use('jsonld').documentLoader;
  cio.use('jsonld').documentLoader = function(url, callback) {
    if(url in MOCK_DOCS) {
      return callback(
        null, {
          contextUrl: null,
          document: MOCK_DOCS[url],
          documentUrl: url
        });
    }
    documentLoader(url, callback);
  };
  program
    .option('--bail', 'Bail when a test fails')
    .parse(process.argv);
} else {
  // TODO: implement
  throw new Error('browser-support not yet implemented.');
  /*
  var system = require('system');
  require('./bind');
  require('./setImmediate');
  var _jsdir = system.env.JSDIR || 'lib';
  var forge = require('../node_modules/node-forge');
  window.forge = forge;
  require('../node_modules/jsonld');
  var jsonld = jsonldjs;
  var uuid = require('node-uuid');
  window.uuid = uuid;
  var didio = require('did-io');
  window.didio = didio;
  require('../' + _jsdir + '/credentials-io');
  var didio = window.didio;
  window.Promise = require('es6-promise').Promise;
  var should = require('chai').should();
  require('mocha/mocha');
  require('mocha-phantomjs/lib/mocha-phantomjs/core_extensions');

  // PhantomJS is really bad at doing XHRs, so we have to fake the network
  // fetch of the JSON-LD Contexts
  cio.use('jsonld', jsonld);
  cio.use('jsonld').documentLoader = function(url, callback) {
    if(url in MOCK_DOCS) {
      return callback(null, {
        contextUrl: null,
        document: MOCK_DOCS[url],
        documentUrl: url
      });
    }
    var err = new Error('Not found.');
    err.status = 404;
    callback(err);
  };

  var program = {};
  for(var i = 0; i < system.args.length; ++i) {
    var arg = system.args[i];
    if(arg.indexOf('--') === 0) {
      var argname = arg.substr(2);
      switch(argname) {
      default:
        program[argname] = true;
      }
    }
  }

  mocha.setup({
    reporter: 'spec',
    ui: 'bdd'
  }); */
}

// run tests
describe('credentials-io', function() {
  var signedIdentity;
  var recipient;

  before(function(done) {
    async.waterfall([
      function(callback) {
        recipient = 'did:' + uuid.v4();
        var credential =
          JSON.parse(JSON.stringify(MOCK_DATA.credentials.driversLicense));
        credential.claim.id = recipient;
        jsigs.sign(credential, {
          algorithm: 'LinkedDataSignature2015',
          privateKeyPem: MOCK_DATA.keys.credentialSigning.privateKeyPem,
          creator: MOCK_DATA.keys.credentialSigning.publicKeyUrl
        }, callback);
      },
      function(signedCredential, callback) {
        var identity = {
          '@context': 'https://w3id.org/identity/v1',
          id: recipient,
          credential: [
            {
              '@graph': signedCredential
            }
          ]
        };
        jsigs.sign(identity, {
          algorithm: 'LinkedDataSignature2015',
          privateKeyPem: MOCK_DATA.keys.identitySigning.privateKeyPem,
          creator: MOCK_DATA.keys.identitySigning.publicKeyUrl
        }, callback);
      }
    ], function(err, result) {
      signedIdentity = result;
      done();
    });
  });

  it('should verify a proper identity', function(done) {
    cio.verify(signedIdentity, function(err, result) {
      should.not.exist(err);
      result.verified.should.be.true;
      done();
    });
  });

  describe('altered identities', function() {
    var alteredIdentity;
    beforeEach(function() {
      alteredIdentity = JSON.parse(JSON.stringify(signedIdentity));
    });

    it('should not validate if identity changed', function(done) {
      alteredIdentity.id = 'did:' + uuid.v4();
      cio.verify(alteredIdentity, function(err, result) {
        should.not.exist(err);
        result.verified.should.equal.false;
        done();
      });
    });
  });
});

// TODO: uncomment w/browser support is implemented
/*
if(!_nodejs) {
  mocha.run(function() {
    phantom.exit();
  });
}*/

function _mockDocs() {
  // documents to mock load
  // jscs:disable
  var MOCK_DOCS = [];
  MOCK_DOCS['https://w3id.org/security/v1'] = {
    "@context": {
      "id": "@id",
      "type": "@type",

      "dc": "http://purl.org/dc/terms/",
      "sec": "https://w3id.org/security#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",

      "EncryptedMessage": "sec:EncryptedMessage",
      "GraphSignature2012": "sec:GraphSignature2012",
      "CryptographicKey": "sec:Key",

      "authenticationTag": "sec:authenticationTag",
      "cipherAlgorithm": "sec:cipherAlgorithm",
      "cipherData": "sec:cipherData",
      "cipherKey": "sec:cipherKey",
      "claim": {"@id": "sec:claim", "@type": "@id"},
      "created": {"@id": "dc:created", "@type": "xsd:dateTime"},
      "creator": {"@id": "dc:creator", "@type": "@id"},
      "credential": {"@id": "sec:credential", "@type": "@id"},
      "digestAlgorithm": "sec:digestAlgorithm",
      "digestValue": "sec:digestValue",
      "domain": "sec:domain",
      "encryptionKey": "sec:encryptionKey",
      "expiration": {"@id": "sec:expiration", "@type": "xsd:dateTime"},
      "expires": {"@id": "sec:expiration", "@type": "xsd:dateTime"},
      "initializationVector": "sec:initializationVector",
      "iterationCount": "sec:iterationCount",
      "nonce": "sec:nonce",
      "normalizationAlgorithm": "sec:normalizationAlgorithm",
      "owner": {"@id": "sec:owner", "@type": "@id"},
      "password": "sec:password",
      "privateKey": {"@id": "sec:privateKey", "@type": "@id"},
      "privateKeyPem": "sec:privateKeyPem",
      "publicKey": {"@id": "sec:publicKey", "@type": "@id"},
      "publicKeyPem": "sec:publicKeyPem",
      "publicKeyService": {"@id": "sec:publicKeyService", "@type": "@id"},
      "revoked": {"@id": "sec:revoked", "@type": "xsd:dateTime"},
      "salt": "sec:salt",
      "signature": "sec:signature",
      "signatureAlgorithm": "sec:signingAlgorithm",
      "signatureValue": "sec:signatureValue"
    }
  };
  MOCK_DOCS['https://w3id.org/identity/v1'] = {
    "@context": {
      "id": "@id",
      "type": "@type",

      "dc": "http://purl.org/dc/terms/",
      "identity": "https://w3id.org/identity#",
      "ps": "https://w3id.org/payswarm#",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "sec": "https://w3id.org/security#",
      "schema": "http://schema.org/",
      "xsd": "http://www.w3.org/2001/XMLSchema#",

      "about": {"@id": "schema:about", "@type": "@id"},
      "address": {"@id": "schema:address", "@type": "@id"},
      "addressCountry": "schema:addressCountry",
      "addressLocality": "schema:addressLocality",
      "addressRegion": "schema:addressRegion",
      "comment": "rdfs:comment",
      "created": {"@id": "dc:created", "@type": "xsd:dateTime"},
      "creator": {"@id": "dc:creator", "@type": "@id"},
      "description": "schema:description",
      "email": "schema:email",
      "familyName": "schema:familyName",
      "givenName": "schema:givenName",
      "image": {"@id": "schema:image", "@type": "@id"},
      "label": "rdfs:label",
      "name": "schema:name",
      "postalCode": "schema:postalCode",
      "streetAddress": "schema:streetAddress",
      "title": "dc:title",
      "url": {"@id": "schema:url", "@type": "@id"},
      "PostalAddress": "schema:PostalAddress",

      "Identity": "identity:Identity",
      "Person": "schema:Person",
      "Organization": "schema:Organization",

      "paymentProcessor": "ps:processor",

      "preferences": {"@id": "ps:preferences", "@type": "@vocab"},

      "credential": {"@id": "sec:credential", "@type": "@id"},
      "cipherAlgorithm": "sec:cipherAlgorithm",
      "cipherData": "sec:cipherData",
      "cipherKey": "sec:cipherKey",
      "claim": {"@id": "sec:claim", "@type": "@id"},
      "digestAlgorithm": "sec:digestAlgorithm",
      "digestValue": "sec:digestValue",
      "domain": "sec:domain",
      "expires": {"@id": "sec:expiration", "@type": "xsd:dateTime"},
      "identityService": {"@id": "identity:identityService", "@type": "@id"},
      "initializationVector": "sec:initializationVector",
      "nonce": "sec:nonce",
      "normalizationAlgorithm": "sec:normalizationAlgorithm",
      "owner": {"@id": "sec:owner", "@type": "@id"},
      "password": "sec:password",
      "privateKey": {"@id": "sec:privateKey", "@type": "@id"},
      "privateKeyPem": "sec:privateKeyPem",
      "publicKey": {"@id": "sec:publicKey", "@type": "@id"},
      "publicKeyPem": "sec:publicKeyPem",
      "publicKeyService": {"@id": "sec:publicKeyService", "@type": "@id"},
      "revoked": {"@id": "sec:revoked", "@type": "xsd:dateTime"},
      "signature": "sec:signature",
      "signatureAlgorithm": "sec:signatureAlgorithm",
      "signatureValue": "sec:signatureValue",
      "EncryptedMessage": "sec:EncryptedMessage",
      "CryptographicKey": "sec:Key",
      "GraphSignature2012": "sec:GraphSignature2012"
    }
  };
  // jscs:enable
  var mockDocs = require('./mock.docs');
  MOCK_DOCS['https://authorization.io/dids/' + mockDocs.didDocument.id] =
    mockDocs.didDocument;
  MOCK_DOCS[mockDocs.keys.publicKeys.mockIssuer.id] =
    mockDocs.keys.publicKeys.mockIssuer;
  MOCK_DOCS[mockDocs.keys.publicKeys.mockIssuer.owner] =
    mockDocs.ownerDocs.mockIssuer;
  MOCK_DOCS[mockDocs.keys.publicKeys.mockAuthority.id] =
    mockDocs.keys.publicKeys.mockAuthority;
  MOCK_DOCS[mockDocs.keys.publicKeys.mockAuthority.owner] =
    mockDocs.ownerDocs.mockAuthority;
  return MOCK_DOCS;
}

})();
