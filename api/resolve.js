const { decrypt } = require('./_crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { readyToken } = req.body || {};
  const readyData = decrypt(readyToken);

  if (!readyData || Date.now() > readyData.exp) {
    return res.status(403).json({ error: 'Izin transit habis masa berlakunya' });
  }

  const originalData = decrypt(readyData.linkToken);
  if (!originalData || !originalData.url) {
    return res.status(400).json({ error: 'Gagal mengekstrak URL tujuan' });
  }

  return res.status(200).json({ destination: originalData.url });
};
