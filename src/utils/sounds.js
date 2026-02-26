// Sound effects using Web Audio API (no external files needed)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silently fail if audio isn't available
  }
}

export function playCoinSound() {
  playTone(880, 0.1, 'square', 0.2);
  setTimeout(() => playTone(1175, 0.15, 'square', 0.15), 80);
}

export function playBonusSound() {
  playTone(523, 0.1, 'square', 0.2);
  setTimeout(() => playTone(659, 0.1, 'square', 0.2), 100);
  setTimeout(() => playTone(784, 0.1, 'square', 0.2), 200);
  setTimeout(() => playTone(1047, 0.2, 'square', 0.25), 300);
}

export function playDeductSound() {
  playTone(330, 0.15, 'sawtooth', 0.15);
  setTimeout(() => playTone(262, 0.2, 'sawtooth', 0.1), 120);
}

export function playRedeemSound() {
  playTone(523, 0.08, 'sine', 0.2);
  setTimeout(() => playTone(659, 0.08, 'sine', 0.2), 80);
  setTimeout(() => playTone(784, 0.08, 'sine', 0.2), 160);
  setTimeout(() => playTone(1047, 0.08, 'sine', 0.25), 240);
  setTimeout(() => playTone(1319, 0.3, 'sine', 0.3), 320);
}

export function playAchievementSound() {
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.2), i * 80);
  });
}

export function playClickSound() {
  playTone(600, 0.05, 'sine', 0.1);
}

// Haptic feedback
export function vibrate(pattern = [10]) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Silently fail
  }
}

export function vibrateEarn() { vibrate([15, 30, 15]); }
export function vibrateBonus() { vibrate([20, 40, 20, 40, 30]); }
export function vibrateDeduct() { vibrate([50]); }
export function vibrateRedeem() { vibrate([15, 30, 15, 30, 15, 30, 50]); }
