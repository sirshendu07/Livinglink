/**
 * User roles in the LivingLink platform.
 * Exactly three primary roles: OWNER, ADMIN, SECURITY.
 */
const ROLES = Object.freeze({
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  SECURITY: 'SECURITY'
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ALL_ROLES
};
