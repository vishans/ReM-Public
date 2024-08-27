const crypto = require('crypto');

const keyLength = parseInt(process.env.API_KEY_LENGTH) || 32;

function generateUrlSafeKey(length) {
  // Generate a buffer of random bytes
  const buffer = crypto.randomBytes(length);

  // Convert buffer to a base64 string
  let key = buffer.toString('base64');

  // Make the key URL-safe by replacing non-URL-safe characters
  key = key.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  // Trim the key to the desired length
  return key.substring(0, length);
}

exports.generateUrlSafeKey = generateUrlSafeKey;
exports.keyLength = keyLength;
