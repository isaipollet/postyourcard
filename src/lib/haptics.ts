/** Trigger light haptic feedback if supported */
export function hapticSuccess() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([10, 30, 10]);
  }
}

export function hapticError() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([50, 30, 50]);
  }
}

export function hapticTap() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(5);
  }
}
