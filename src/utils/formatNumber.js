/**
 * Format number with commas as thousands separators
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export const formatCurrency = (number, decimals = 2) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0.00';
  }

  return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format number with commas (no decimal places)
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return Math.round(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
