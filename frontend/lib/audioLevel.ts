let currentLevel = 0;

export function getAudioLevel(): number {
  return currentLevel;
}

export function setAudioLevel(level: number): void {
  currentLevel = Math.max(0, Math.min(1, level));
}