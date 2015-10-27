/**
 * Test runner for Credentials I/O library.
 *
 * @author Dave Longley <dlongley@digitalbazaar.com>
 * @author Manu Sporny <msporny@digitalbazaar.com>
 *
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 */
(function() {

'use strict';

// detect node.js (vs. phantomJS)
var _nodejs = (typeof process !== 'undefined' &&
  process.versions && process.versions.node);

var MOCK_DOCS = _mockDocs();

if(_nodejs) {
  var _jsdir = process.env.JSDIR || 'lib';
  var cio = require('../' + _jsdir + '/credentials-io');
  var program = require('commander');
  var should = require('chai').should();
  var jsonld = require('jsonld');
  cio.use('jsonld', jsonld);
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
  // TODO: implement
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
  var MOCK_DOCS = {
    'https://w3id.org/security/v1': {
      "@context": {
        "id": "@id",
        "type": "@type",

        "dc": "http://purl.org/dc/terms/",
        "sec": "https://w3id.org/security#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",

        "EncryptedMessage": "sec:EncryptedMessage",
        "GraphSignature2012": "sec:GraphSignature2012",
        "LinkedDataSignature2015": "sec:LinkedDataSignature2015",
        "CryptographicKey": "sec:Key",

        "authenticationTag": "sec:authenticationTag",
        "cipherAlgorithm": "sec:cipherAlgorithm",
        "cipherData": "sec:cipherData",
        "cipherKey": "sec:cipherKey",
        "created": {"@id": "dc:created", "@type": "xsd:dateTime"},
        "creator": {"@id": "dc:creator", "@type": "@id"},
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
    },
    'https://w3id.org/identity/v1': {
      "@context": {
        "id": "@id",
        "type": "@type",

        "cred": "https://w3id.org/credentials#",
        "dc": "http://purl.org/dc/terms/",
        "identity": "https://w3id.org/identity#",
        "perm": "https://w3id.org/permissions#",
        "ps": "https://w3id.org/payswarm#",
        "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "sec": "https://w3id.org/security#",
        "schema": "http://schema.org/",
        "xsd": "http://www.w3.org/2001/XMLSchema#",

        "claim": {"@id": "cred:claim", "@type": "@id"},
        "credential": {"@id": "cred:credential", "@type": "@id"},
        "issued": {"@id": "cred:issued", "@type": "xsd:dateTime"},
        "issuer": {"@id": "cred:issuer", "@type": "@id"},
        "recipient": {"@id": "cred:recipient", "@type": "@id"},
        "Credential": "cred:Credential",
        "CryptographicKeyCredential": "cred:CryptographicKeyCredential",

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
        "Person": "schema:Person",
        "PostalAddress": "schema:PostalAddress",
        "Organization": "schema:Organization",

        "identityService": {"@id": "identity:identityService", "@type": "@id"},
        "idp": {"@id": "identity:idp", "@type": "@id"},
        "Identity": "identity:Identity",

        "paymentProcessor": "ps:processor",
        "preferences": {"@id": "ps:preferences", "@type": "@vocab"},

        "cipherAlgorithm": "sec:cipherAlgorithm",
        "cipherData": "sec:cipherData",
        "cipherKey": "sec:cipherKey",
        "digestAlgorithm": "sec:digestAlgorithm",
        "digestValue": "sec:digestValue",
        "domain": "sec:domain",
        "expires": {"@id": "sec:expiration", "@type": "xsd:dateTime"},
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
        "CryptographicKey": "sec:Key",
        "EncryptedMessage": "sec:EncryptedMessage",
        "GraphSignature2012": "sec:GraphSignature2012",
        "LinkedDataSignature2015": "sec:LinkedDataSignature2015",

        "accessControl": {"@id": "perm:accessControl", "@type": "@id"},
        "writePermission": {"@id": "perm:writePermission", "@type": "@id"}
      }
    }
  };
  var mockConfig = require('./mock.config');
  MOCK_DOCS['https://authorization.io/dids/' + mockConfig.didDocument.id] =
    mockConfig.didDocument;
  return MOCK_DOCS;
}

})();
