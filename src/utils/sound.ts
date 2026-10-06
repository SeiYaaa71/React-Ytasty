/** Petit « ding » généré avec la Web Audio API (pas de fichier audio à charger). */
export const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [880, 1320].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const start = now + index * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.4);
    });
    window.setTimeout(() => void ctx.close(), 1000);
  } catch {
    // Le navigateur peut bloquer le son tant que l'utilisateur n'a pas interagi avec la page.
  }
};
