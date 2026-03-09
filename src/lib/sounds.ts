'use client';

// Kawabel Sound Effects — Web Audio API synth sounds (no external files needed)

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function osc(
  type: OscillatorType,
  freq: number,
  duration: number,
  gain: number,
  startTime: number,
  endFreq?: number,
) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, startTime);
  if (endFreq) o.frequency.linearRampToValueAtTime(endFreq, startTime + duration);
  g.gain.setValueAtTime(gain, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  o.connect(g).connect(c.destination);
  o.start(startTime);
  o.stop(startTime + duration);
}

/** Ascending ding — correct answer */
export function playCorrect() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 523.25, 0.15, 0.3, t);       // C5
    osc('sine', 659.25, 0.15, 0.3, t + 0.08); // E5
    osc('sine', 783.99, 0.25, 0.25, t + 0.16); // G5
  } catch { /* audio not available */ }
}

/** Low buzz — wrong answer */
export function playWrong() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    osc('sawtooth', 150, 0.3, 0.15, t, 100);
    osc('sawtooth', 130, 0.3, 0.12, t, 90);
  } catch { /* audio not available */ }
}

/** Coin sparkle — XP earned */
export function playXP() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 1200, 0.08, 0.2, t);
    osc('sine', 1600, 0.08, 0.2, t + 0.06);
    osc('sine', 2000, 0.12, 0.15, t + 0.12);
  } catch { /* audio not available */ }
}

/** Triumphant fanfare — level up */
export function playLevelUp() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      osc('sine', freq, 0.25, 0.25, t + i * 0.12);
      osc('triangle', freq * 2, 0.2, 0.1, t + i * 0.12);
    });
    // Final shimmer
    osc('sine', 1046.50, 0.5, 0.2, t + 0.48);
  } catch { /* audio not available */ }
}

/** Magical sparkle — chest open */
export function playChestOpen() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    // Rising sparkle notes
    for (let i = 0; i < 6; i++) {
      const freq = 800 + i * 200;
      osc('sine', freq, 0.12, 0.15 - i * 0.02, t + i * 0.07);
    }
    // Magic shimmer
    osc('triangle', 2400, 0.4, 0.1, t + 0.35);
  } catch { /* audio not available */ }
}

/** Fire whoosh — streak */
export function playStreak() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    osc('sawtooth', 200, 0.3, 0.1, t, 800);
    osc('sine', 400, 0.25, 0.15, t + 0.05, 1200);
  } catch { /* audio not available */ }
}

/** Gentle notification ping */
export function playNudge() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 880, 0.15, 0.2, t);
    osc('sine', 1108.73, 0.2, 0.15, t + 0.1);
  } catch { /* audio not available */ }
}

/** Subtle click */
export function playTap() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 600, 0.04, 0.15, t);
  } catch { /* audio not available */ }
}

/** Escalating dings for combo streaks */
export function playCombo(comboCount: number) {
  try {
    const c = getCtx();
    const t = c.currentTime;
    // Base pitch increases with combo
    const base = 523.25 + Math.min(comboCount, 10) * 50;
    osc('sine', base, 0.1, 0.25, t);
    osc('sine', base * 1.25, 0.1, 0.2, t + 0.06);
    if (comboCount >= 5) {
      osc('sine', base * 1.5, 0.15, 0.18, t + 0.12);
    }
    if (comboCount >= 10) {
      osc('triangle', base * 2, 0.2, 0.12, t + 0.18);
    }
  } catch { /* audio not available */ }
}
