const crypto = require('crypto');

const SECRET_KEY = crypto
  .createHash('sha256')
  .update(process.env.APP_SECRET || 'zerotrace-core-engine-noxm007-key-32b!')
  .digest();

function encrypt(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}.${tag}.${encrypted}`;
}

function decrypt(ciphertext) {
  try {
    const [ivHex, tagHex, encrypted] = ciphertext.split('.');
    if (!ivHex || !tagHex || !encrypted) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

module.exports = { encrypt, decrypt };
