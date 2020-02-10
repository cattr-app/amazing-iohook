/**
 * Installation script for at-iohook
 * @version 0.1.0
 */

// Dependencies
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

// Downloads a file from url to the targetPath, verifying it's signature
const downloadAndCheckSignature = async (url, targetPath) => {

  // Buffer for incomming data
  const downloadedBinary = fs.createWriteStream(targetPath);
  const verificator = crypto.createVerify('sha256');

  // Downloading binary
  const request = https.get(url, res => {

    // Checking status code
    if (res.statusCode !== 200) throw new Error('Cannot find prebuilt binary for this platform');

    // Fill buffers with the downloaded binary
    res.pipe(downloadedBinary);
    res.pipe(verificator);

    // Handle ending of the downloading process
    downloadedBinary.on('finish', async () => {

      // Closing WriteStream
      downloadedBinary.close();

      // Getting a file name for logging purposes
      let filename = targetPath.split('/');
      filename = filename[filename.length - 1];

      console.log(` => ${filename} download finished, downloading signature..`);

      // Making a url for a signature to request
      const signUrl = `${url}.sig`;

      // Downloading signature
      const signReq = https.get(signUrl, signRes => {

        if (signRes.statusCode !== 200) throw new Error(`Cannot find signature for downloaded file form ${signUrl}`);

        // Buffer for signature
        let signature = '';
        signRes.on('data', chunk => (signature += chunk));

        // Catching end of signature download
        signRes.on('end', () => {

          console.log(` => Signature for ${filename} downloaded, verifying..`);
          signature = Buffer.from(signature, 'base64');

          // Verifying file
          if (!verificator.verify(signingKey, signature)) {

            // Removing downloaded file and throw error
            fs.unlinkSync(targetPath);
            throw new Error(`Unfortunately, ${filename} has broken signature`);

          }

          // Everything is fine
          console.log(` => (✓) Signature for ${filename} verified`);

        });

      });

      signReq.on('error', error => {

        console.log('Error during signature download:', error);

      });

    });

  });

  request.on('error', error => {

    fs.unlinkSync(targetPath);
    console.log('Error during binaries download:', error);

  });

};

// Package configuration
const targetDirectory = require('path').resolve(__dirname, './native');
const packageInfo = require('./package.json');

// Getting current runtime
const { runtime } = packageInfo.preloadBinaries;

// Decode signing key
const signingKey = Buffer.from(packageInfo.preloadBinaries.signingKey, 'base64').toString('utf8');

// Build platform + architecture string
let buildString = process.platform;
buildString += (process.arch.length === 3 && process.arch[0] === 'x') ? process.arch.substring(1) : process.arch;
console.log('Target architecture is', buildString);

// Checking if these platform and architecture are supported
if (packageInfo.preloadBinaries.arch.indexOf(buildString) === -1) throw new Error('This platform is not supported');
console.log('Seems like this platform is supported, downloading prebuilt binary..');

// Url to bin file
const repoBinaryURL = `${packageInfo.preloadBinaries.repo}/${packageInfo.preloadBinaries.branch}/${runtime.type}/${runtime.version}/iohook.${buildString}.node`;

downloadAndCheckSignature(repoBinaryURL, `${targetDirectory}/iohook.${buildString}.node`);

// If on win32
if (buildString === 'win3264') {

  console.log(' => (✓) downloading a .dll for windows platform');

  // Download .dll for bin file (need on windows only)
  const dllUrl = `${packageInfo.preloadBinaries.repo}/${packageInfo.preloadBinaries.branch}/${runtime.type}/${runtime.version}/uiohook.dll`;
  downloadAndCheckSignature(dllUrl, `${targetDirectory}/uiohook.dll`);

}
