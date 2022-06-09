/**
 * Quick Guide - How To Use This Script
 * 1. Set environment variables `TAXII_PATH_TO_PUBLIC_KEY` and `TAXII_PATH_TO_PRIVATE_KEY`
 * 2. Run encodePem.js
 * 3. The script writes the base64 encoded keys to stdout. Copy these values to `TAXII_SSL_PRIVATE_KEY` and
 *    `TAXII_SSL_PUBLIC_KEY` in your `.env` file.
 *
 * Example:
 * $ export TAXII_PATH_TO_PRIVATE_KEY=/path/to/private-key.pem
 * $ export TAXII_PATH_TO_PUBLIC_KEY=/path/to/public-certificate.pem
 * $ node ./encodePem.js
 */

const fs = require("fs");

try {
    const privateKey = fs.readFileSync(process.env.TAXII_PATH_TO_PRIVATE_KEY);
    const privateKeyEncoded = Buffer.from(privateKey).toString('base64');

    const publicKey = fs.readFileSync(process.env.TAXII_PATH_TO_PUBLIC_KEY);
    const publicKeyEncoded = Buffer.from(publicKey).toString('base64');

    console.log('The encoded private key is:');
    console.log(`${privateKeyEncoded}\n`);

    console.log('The encoded public key is:');
    console.log(publicKeyEncoded);

} catch (e) {
    console.error(e);
    process.exit(1);
}