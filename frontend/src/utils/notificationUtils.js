/**
 * Notification Utility Functions
 * Used to dispatch notification events that are listened to by the Header component
 */

/**
 * Increment the notification badge count
 * @param {number} count - Number of notifications to add (default: 1)
 * @param {string} userId - User ID (optional, for multi-user support)
 */
export const incrementNotificationCount = (count = 1, userId = null) => {
  const event = new CustomEvent('notification:new', {
    detail: { count }
  });
  window.dispatchEvent(event);
};

/**
 * Reset notification count to zero
 * @param {string} userId - User ID (optional, for multi-user support)
 */
export const resetNotificationCount = (userId = null) => {
  const notifKey = `notifications_count_${userId || 'guest'}`;
  localStorage.removeItem(notifKey);
};

/**
 * Get current notification count from localStorage
 * @param {string} userId - User ID (optional, for multi-user support)
 * @returns {number} Current notification count
 */
export const getNotificationCount = (userId = null) => {
  const notifKey = `notifications_count_${userId || 'guest'}`;
  const stored = localStorage.getItem(notifKey);
  return stored ? parseInt(stored, 10) : 0;
};
