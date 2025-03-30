// xpUtils.js
export const calculateXpThreshold = (level) => {
  return Math.floor(1000 * (1.5 ** (level - 1)));
};
  