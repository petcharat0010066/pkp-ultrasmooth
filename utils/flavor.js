const CATEGORIES = [
  'ทั้งหมด',
  'นมและครีม',
  'ช็อกโกแลตและบราวนี่',
  'ผลไม้และซอร์เบต์',
  'ชาและกาแฟ',
  'ถั่วและคาราเมล'
];

function getFlavorStyle(category) {
  const styles = {
    'นมและครีม': { bg: '#fdf2f8', border: '#fbcfe8', scoop: '#fbcfe8' },
    'ช็อกโกแลตและบราวนี่': { bg: '#fff1f2', border: '#fecdd3', scoop: '#9d174d' },
    'ผลไม้และซอร์เบต์': { bg: '#fdf4ff', border: '#f5d0fe', scoop: '#f472b6' },
    'ชาและกาแฟ': { bg: '#fdf2f8', border: '#fbcfe8', scoop: '#f9a8d4' },
    'ถั่วและคาราเมล': { bg: '#fff1f2', border: '#fecdd3', scoop: '#ec4899' }
  };
  return styles[category] || { bg: '#fdf2f8', border: '#fbcfe8', scoop: '#fbcfe8' };
}

module.exports = { CATEGORIES, getFlavorStyle };
