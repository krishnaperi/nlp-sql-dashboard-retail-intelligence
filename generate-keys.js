const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

fs.writeFileSync('snowflake_rsa_key.p8', privateKey);
fs.writeFileSync('snowflake_rsa_key.pub', publicKey);

// Strictly extract only the base64 content, remove entirely all whitespace and headers/footers
const pubStripped = publicKey
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '') // removes all newlines, spaces, carriage returns
    .trim();

console.log('\n✅ Keys generated: snowflake_rsa_key.p8 and snowflake_rsa_key.pub\n');
console.log('👉 Run this SQL in Snowsight to register the key:');
console.log('----------------------------------------------------------------');
console.log('ALTER USER <YOUR_USERNAME> SET RSA_PUBLIC_KEY=\'' + pubStripped + '\';');
console.log('----------------------------------------------------------------');
console.log('\nThen verify with:');
console.log('DESC USER <YOUR_USERNAME>;');
