'use client';

// Kawabel Haptic Feedback — navigator.vibrate() wrapper with silent fallback

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch { /* haptics not available */ }
}

/** Light tap */
export function hapticLight() {
  vibrate(10);
}

/** Medium impact */
export function hapticMedium() {
  vibrate(25);
}

/** Heavy impact */
export function hapticHeavy() {
  vibrate(50);
}

/** Success pattern — two quick taps */
export function hapticSuccess() {
  vibrate([15, 50, 15]);
}

/** Error pattern — long buzz */
export function hapticError() {
  vibrate([50, 30, 80]);
}

/** Notification buzz */
export function hapticNotification() {
  vibrate([10, 30, 10, 30, 10]);
}
