/* global module */
/* jshint -W097 */
'use strict';

var dateTime = new Date().toJSON();
var credentials = {};
// jscs:disable
credentials.driversLicense = {
    "@context": "https://w3id.org/identity/v1",
    "id": "https://mock-issuing-authority.org/credentials/" + Date.now(),
    "type": [
      "Credential",
      "urn:test:ProofOfResidenceCredential"
    ],
    "name": "U.S. Residence Credential",
    "issued": dateTime,
    "issuer": "urn:issuer:test",
    "image": "https://cdn.rawgit.com/google/material-design-icons/182053460b9e96cab11924c0b50dcb50dc8d5366/notification/2x_web/ic_vpn_lock_black_48dp.png",
    "claim": {
      "address": {
        "type": "PostalAddress",
        "addressCountry": "US",
        "addressRegion": "Virginia"
      }
    }
  };

// jscs:enable
var keys = {};
keys.credentialSigning = {
  owner: 'https://mock-issuing-authority.org',
  publicKeyUrl: 'https://mock-issuing-authority.org/keys/1',
  publicKeyPem: '-----BEGIN PUBLIC KEY-----\n' +
    'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAs5Ymq5gb9cBVZXvy2Xk9\n' +
    'EicNt3WpF0XouqV/EwibuGlDZwhk+eeDVOnayQKlSpdX3EBDKEWOdDdO9uCm6WZ3\n' +
    'Kxuu9So5vZprvjS43tkBLyhaDY6AGTdJOOkvoLmeDXESUcNHE0o1qXazny9CMnj5\n' +
    'Zr7wE7ZvFhVkuD9ueSZzm0oH96EZQzcX1G+KKhcONy9NYInRcuBTReBacq3z9iDX\n' +
    'o1IY9Mru2WMV3COW2S1HhPKjasAPL252WQRldyZZ00GV4OMXBleT7lMtRgD324sr\n' +
    'Dk3XIZy9gj6UoNO8uGGSGonUTo6conQnHIUUtmqCRnrI8ok1xulOuathBp9FeTsu\n' +
    'FNuFRZQ4F05wyhb5DkKY+3AxmcQyv36PXFMez+fRbduhJFDxGYiwBI1uCzX+IaoV\n' +
    'cAcL58DScuwAHShOQPlQ8WHG+TJCop6pAOMkfK3U1bnH1bIddLMFQlLUKDgB2fi1\n' +
    'UqBVXuPOgq+l7JqHcNb4mu7pMbCewYcy7B7iLSf7hHBI3TE/KlaPfpMOm3/iqR66\n' +
    '48DGLLDbl6TQ3slNhaETC/kMe4r3xCUM1sNaQRgtcCsX/c35e8dqqjqR+9GDGgfC\n' +
    'bvEZm00jnkV+LPXXZDGResGCGZYG5ZINVtFUe6xPAdYCvny1DGSFPw18/sliXBtR\n' +
    'oqhSsgEFHXYc7m+L7rb82pECAwEAAQ==\n' +
    '-----END PUBLIC KEY-----\n',
  privateKeyPem: '-----BEGIN RSA PRIVATE KEY-----\n' +
    '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\n' +
    '-----END RSA PRIVATE KEY-----\n'
};
keys.identitySigning = {
  owner: 'https://mock.mock-issuer.com',
  publicKeyUrl: 'https://mock.mock-issuer.com/keys/1',
  publicKeyPem: '-----BEGIN PUBLIC KEY-----\n' +
    'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAxBTbcgMr6WY74XoUkXBg\n' +
    'n+0PUP2XE4fbcvALoBSBIlMcWep8TUl4/BGM2FBwbgeEgp9ZRJ8dObiK+ZqQjFOh\n' +
    'Gfj0PYP3Xb0c5Djrm0qmC8NRgVO4h2QNEX3Keps1bC6+S096n5XS9qiRsMfr4vN5\n' +
    'ohV9svSP9mmRs+iEs3UBWJl6uoMpkopCxViI1GhhYGjCoB+MGnVJbgEwPjA4POAm\n' +
    'WyMm76tSx0vpI0HLFdN0S9tghrl4jkAzFaBILMfoakx/LpFOiAApivM7HF6YeDZT\n' +
    'MOk6wVYMbbd1jiiy4PLj+nKl96K7RMU+RQZekAZ6Y2FU7wrAbOVBwaXaaRUTVIrN\n' +
    'hOCl7ihXo4w348rVNmDT0pejbSx2QbOY/X7NfUePIkOpyekRChGCrQL3KIicpKCA\n' +
    'bJG83U4niPsynBI3Y/zWvDgs8R/FxEc/UdlBB6Mr9jAeOhbY5vhH1E5dyThJD9Px\n' +
    'pmlY2PuzeAUscsfoXzxHRo2CLzanbvKJKXxMpMVl9lPyvVQHAevVZJO+kJf+Mpzw\n' +
    'Q5X4x/THt7NpSLDjpTsISQGc+0X3DhKvYzcW0iW/bDc9IqXuCPGqa/xf7XhNRLzg\n' +
    '41J2uX0nX9yWwl1opexN3dCxCsYNKTqBTq3uY1aK6WnWWXWt4t8G42A3bKv/7Ncu\n' +
    '9jEBOHnbHLXdQPk+q6wFNfECAwEAAQ==\n' +
    '-----END PUBLIC KEY-----\n',
  privateKeyPem: '-----BEGIN RSA PRIVATE KEY-----\n' +
    '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\n' +
    '-----END RSA PRIVATE KEY-----\n'
};

module.exports = {
  credentials: credentials,
  keys: keys
};
