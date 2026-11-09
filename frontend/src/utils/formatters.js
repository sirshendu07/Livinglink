/**
 * Currency formatter for paise to INR (₹)
 */
export const formatCurrency = (amountInPaise = 0) => {
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(rupees);
};

/**
 * Format Date to readable standard: e.g. "09 Nov 2026"
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format Date & Time: e.g. "09 Nov 2026, 08:30 PM"
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Relative time: e.g. "5m ago", "2h ago", "Yesterday"
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return formatDate(dateString);
};

/**
 * Format standard numbers: e.g. 1000 -> 1,000
 */
export const formatNumber = (num = 0) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const getRelativeTime = (dateString) => formatTimeAgo(dateString);

/**
 * Helper to capitalize and format enum strings: 'FOOD_DELIVERY' -> 'Food Delivery'
 */
export const formatEnum = (str = '') => {
  if (!str) return '';
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
