# credentials-io
Library for reading/writing credentials

## API

### verify(identity, options, callback)
Verifies digital signature on identity object and any credentials it contains.
The call takes the following arguments:
* **identity** (**required** *object*) - the idenity to check
 * the identity object is defined here: https://w3id.org/identity/v1
* **options** (*object*)
 * **checkTimestamp** (*boolean*) - check signature timestamp (default: true) on the main Identity credential.
 * **maxTimestampDelta** (*int*) - signature must be created within a window of this many seconds (default: 15 minutes).
 * **documentLoader(url, callback(err, remoteDoc))** (*function*) - the document loader.
* **callback(err, result)** (*function*) - the callback recieves the following object:
```
{
 verified: <true/false>,
 identity: <framed identity>,
 domain: <domain the signature was signed for>,
 publicKey: <public key object for the creator of the signature>,
 publicKeyOwner: <identity object for the creator of the signature>,
 // a map of verified objects for each credential (ID => verified)
 credentials: {}
}
```

### send(options, callback)
Sends credentials to a URL using http-signatures for authentication. 
The call takes the following arguments:
* **options** (**required** *object*)
 * **url** (**required** *string*) - the url to send the credential to
 * **credential** (**required** *object*) - the credential that is sent to the url
  * the credential object is defined here: https://w3id.org/credentials/v1
 * **privateKeyPem** (**required** *string*)
 * **publickKeyId** (**required** *string*)
