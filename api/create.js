const { encrypt } = require('./_crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Format URL tidak valid' });
  }

  const payload = {
    url,
    dev: 'noxm007',
    created: Date.now()
  };

  const encryptedToken = encrypt(payload);
  return res.status(200).json({
    success: true,
    token: encryptedToken,
    generator: 'ZeroTrace by noxm007'
  });
};
