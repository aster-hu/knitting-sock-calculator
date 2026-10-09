export const PRESETS = {
  S: { circumference: 20, length: 23 },
  M: { circumference: 22, length: 25 },
  L: { circumference: 24, length: 27 },
  XL: { circumference: 26, length: 29 },
};

export const DEFAULTS = {
  direction: 'cuff', heel: 'flap', unit: 'cm', preset: 'M',
  circumference: 22, length: 25, stitchGauge: 28, rowGauge: 40,
  ease: 10, cuffHeight: 4, legHeight: 12, heelAllowance: 5,
};

export const cmToIn = value => value / 2.54;
export const inToCm = value => value * 2.54;
export const nearestFour = value => Math.round(value / 4) * 4;

export function calculate(input) {
  const circumference = Number(input.circumference);
  const length = Number(input.length);
  const stitchGauge = Number(input.stitchGauge);
  const rowGauge = Number(input.rowGauge);
  const ease = Number(input.ease);
  const cuffHeight = Number(input.cuffHeight);
  const legHeight = Number(input.legHeight);
  const heelAllowance = Number(input.heelAllowance);

  if (![circumference, length, stitchGauge, rowGauge, cuffHeight, legHeight, heelAllowance].every(Number.isFinite)
      || circumference <= 0 || length <= 0 || stitchGauge <= 0 || rowGauge <= 0
      || cuffHeight < 0 || legHeight < 0 || heelAllowance <= 0
      || !Number.isFinite(ease) || ease < 0 || ease > 25) return null;

  const rawStitches = circumference * (1 - ease / 100) * stitchGauge / 10;
  const stitches = Math.max(32, nearestFour(rawStitches));
  const heelStitches = stitches / 2;
  const flapRows = heelStitches;
  const pickup = flapRows / 2;
  const classicSide = Math.floor(heelStitches / 3);
  const classicCenter = heelStitches - 2 * classicSide;
  // Square (Dutch) turn: every row decreases one side stitch, so 2 × side rows in all.
  const classicTurnRows = 2 * classicSide;
  const classicGussetSetupStitches = stitches + classicCenter;
  const classicGussetDecreaseRounds = classicCenter / 2;
  const flkTwinsPerSide = Math.round((heelStitches - 2) / 3);
  const flkCenter = heelStitches - 2 - 2 * flkTwinsPerSide;
  const toeUpGussetPerSide = Math.round(heelStitches * 0.375);
  const gussetStitches = stitches + toeUpGussetPerSide * 2;
  const toeStitches = Math.max(8, nearestFour(stitches / 4));
  const toeMid = nearestFour(stitches / 2);
  const fastToeRounds = (toeMid - toeStitches) / 4;
  const slowToeIncreaseRounds = (stitches - toeMid) / 4;
  const toeRounds = fastToeRounds + slowToeIncreaseRounds * 2;
  const toeLength = toeRounds * 10 / rowGauge;
  const gussetRounds = toeUpGussetPerSide * 2;
  const gussetLength = gussetRounds * 10 / rowGauge;
  const cuffRounds = Math.round(cuffHeight * rowGauge / 10);
  const legRounds = Math.round(legHeight * rowGauge / 10);
  const actualCircumference = stitches * 10 / stitchGauge;
  const toeStart = Math.max(0, length - toeLength);
  const gussetStart = Math.max(0, length - gussetLength);
  const shortRowStart = Math.max(0, length - heelAllowance);
  return { rawStitches, stitches, heelStitches, flapRows, pickup,
    classicSide, classicCenter, classicTurnRows, classicGussetSetupStitches, classicGussetDecreaseRounds,
    flkTwinsPerSide, flkCenter, toeUpGussetPerSide, gussetStitches,
    toeStitches, toeMid, fastToeRounds, slowToeIncreaseRounds, toeRounds, toeLength,
    gussetRounds, gussetLength, cuffRounds, legRounds, actualCircumference,
    toeStart, gussetStart, shortRowStart };
}
