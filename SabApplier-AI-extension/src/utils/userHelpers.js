/**
 * Helper function to determine if a user object is valid for Dashboard display
 * Works with both JWT authenticated users and legacy users
 */
export const isValidUser = (user) => {
  if (!user) return false;
  
  // Check for either email or name
  return (
    (user.email && typeof user.email === 'string') || 
    (user.name && typeof user.name === 'string')
  );
};

/**
 * Helper function to determine if a user is JWT authenticated
 */
export const isJWTAuthenticated = (user) => {
  return user && user.isJWTAuthenticated && user.token;
};

/**
 * Helper function to get a user's display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'User';
  
  return user.name || 
         (user.email ? user.email.split('@')[0] : 'User');
};

export default {
  isValidUser,
  isJWTAuthenticated,
  getUserDisplayName
};
