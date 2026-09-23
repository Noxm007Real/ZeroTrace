const crypto = require('crypto');
const { encrypt, decrypt } = require('./_crypto');

const ALL_MODULES = ['pow', 'slider', 'delay'];

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { linkToken } = req.body || {};
  const linkData = decrypt(linkToken);
  if (!linkData) return res.status(400).json({ error: 'Token ZeroTrace tidak valid atau rusak' });

  // Acak kombinasi pipeline (2 atau 3 tahap)
  const shuffled = [...ALL_MODULES].sort(() => 0.5 - Math.random());
  const pipeline = shuffled.slice(0, Math.floor(Math.random() * 2) + 2);

  const firstStep = pipeline[0];
  const stepData = {};

  if (firstStep === 'pow') {
    stepData.salt = crypto.randomBytes(8).toString('hex');
    stepData.difficulty = 4;
  }

  const sessionPayload = {
    linkToken,
    pipeline,
    currentStepIndex: 0,
    stepData,
    exp: Date.now() + 180000 // Berlaku 3 menit
  };

  const sessionToken = encrypt(sessionPayload);
  return res.status(200).json({
    sessionToken,
    currentStep: firstStep,
    stepData,
    totalSteps: pipeline.length
  });
};
