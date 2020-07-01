export function deferException(callback: () => void): void {
  try {
    callback();
  } catch (e) {
    setTimeout(() => {
      throw e;
    }, 0);
  }
}
