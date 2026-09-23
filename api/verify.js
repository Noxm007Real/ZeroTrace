const crypto = require('crypto');
const { encrypt, decrypt } = require('./_crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionToken, proof } = req.body || {};
  const session = decrypt(sessionToken);

  if (!session || Date.now() > session.exp) {
    return res.status(403).json({ error: 'Sesi kedaluwarsa atau tidak sah' });
  }

  const activeStep = session.pipeline[session.currentStepIndex];

  // 1. Verifikasi PoW
  if (activeStep === 'pow') {
    const { nonce } = proof || {};
    const hash = crypto.createHash('sha256').update(`${session.stepData.salt}${nonce}`).digest('hex');
    if (!hash.startsWith('0'.repeat(session.stepData.difficulty))) {
      return res.status(400).json({ error: 'Bukti PoW tidak valid' });
    }
  }

  // 2. Verifikasi Slider & Telemetri Kursor
  if (activeStep === 'slider') {
    const { isTrusted, points } = proof || {};
    if (!isTrusted || !Array.isArray(points) || points.length < 5) {
      return res.status(400).json({ error: 'Deteksi otomatis: interaksi tidak natural' });
    }
  }

  // 3. Verifikasi Delay Klien
  if (activeStep === 'delay') {
    if (!proof || proof.waited < 2500) {
      return res.status(400).json({ error: 'Interval sinkronisasi terlalu singkat' });
    }
  }

  session.currentStepIndex += 1;

  // Cek apakah seluruh rantai telah selesai
  if (session.currentStepIndex >= session.pipeline.length) {
    return res.status(200).json({
      done: true,
      readyToken: encrypt({ linkToken: session.linkToken, exp: Date.now() + 30000 })
    });
  }

  // Siapkan modul berikutnya
  const nextStep = session.pipeline[session.currentStepIndex];
  session.stepData = {};
  if (nextStep === 'pow') {
    session.stepData.salt = crypto.randomBytes(8).toString('hex');
    session.stepData.difficulty = 4;
  }

  const updatedSessionToken = encrypt(session);
  return res.status(200).json({
    done: false,
    nextStep,
    stepData: session.stepData,
    sessionToken: updatedSessionToken,
    stepIndex: session.currentStepIndex
  });
};
