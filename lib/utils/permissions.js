/**
 * Permission and Role Management Utilities
 * Centralized permission checking for team management
 */

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  owner: 5,
  admin: 4,
  manager: 3,
  member: 2,
  viewer: 1,
};

// Permission definitions
export const PERMISSIONS = {
  // Organization
  ORG_READ: "org:read",
  ORG_WRITE: "org:write",
  ORG_DELETE: "org:delete",

  // Members
  MEMBERS_VIEW: "members:view",
  MEMBERS_INVITE: "members:invite",
  MEMBERS_REMOVE: "members:remove",
  MEMBERS_CHANGE_ROLE: "members:change_role",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MODIFY: "settings:modify",

  // Webhook
  WEBHOOK_VIEW: "webhook:view",
  WEBHOOK_CONFIGURE: "webhook:configure",

  // Analytics
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_EXPORT: "analytics:export",

  // SOS
  SOS_CREATE: "sos:create",
  SOS_VIEW: "sos:view",
  SOS_ASSIGN: "sos:assign",
};

// Permission requirements by role
const PERMISSION_REQUIREMENTS = {
  [PERMISSIONS.ORG_READ]: 1, // All roles
  [PERMISSIONS.ORG_WRITE]: 4, // Admin+
  [PERMISSIONS.ORG_DELETE]: 5, // Owner only

  [PERMISSIONS.MEMBERS_VIEW]: 1, // All roles
  [PERMISSIONS.MEMBERS_INVITE]: 4, // Admin+
  [PERMISSIONS.MEMBERS_REMOVE]: 4, // Admin+
  [PERMISSIONS.MEMBERS_CHANGE_ROLE]: 5, // Owner only

  [PERMISSIONS.SETTINGS_VIEW]: 2, // Member+
  [PERMISSIONS.SETTINGS_MODIFY]: 4, // Admin+

  [PERMISSIONS.WEBHOOK_VIEW]: 2, // Member+
  [PERMISSIONS.WEBHOOK_CONFIGURE]: 4, // Admin+

  [PERMISSIONS.ANALYTICS_VIEW]: 2, // Member+
  [PERMISSIONS.ANALYTICS_EXPORT]: 3, // Manager+

  [PERMISSIONS.SOS_CREATE]: 2, // Member+
  [PERMISSIONS.SOS_VIEW]: 1, // All roles
  [PERMISSIONS.SOS_ASSIGN]: 3, // Manager+
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const roleLevel = ROLE_HIERARCHY[role] || 0;
  const requiredLevel = PERMISSION_REQUIREMENTS[permission] || 999;

  return roleLevel >= requiredLevel;
}

/**
 * Check if a role can manage another role
 * @param {string} managerRole - Role doing the action
 * @param {string} targetRole - Role being acted upon
 * @returns {boolean}
 */
export function canManageRole(managerRole, targetRole) {
  const managerLevel = ROLE_HIERARCHY[managerRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 9;

  // Can only manage roles below your level
  return managerLevel > targetLevel;
}

/**
 * Check if user can perform action on target user
 * @param {string} userRole - Acting user's role
 * @param {string} targetRole - Target user's role
 * @param {string} action - Action to perform
 * @returns {boolean}
 */
export function canPerformAction(userRole, targetRole, action) {
  // Check if user has permission for this action
  if (!hasPermission(userRole, action)) {
    return false;
  }

  // For membership changes, check role hierarchy
  if (
    action === PERMISSIONS.MEMBERS_REMOVE ||
    action === PERMISSIONS.MEMBERS_CHANGE_ROLE
  ) {
    return canManageRole(userRole, targetRole);
  }

  return true;
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} Array of permissions
 */
export function getRolePermissions(role) {
  return Object.keys(PERMISSION_REQUIREMENTS).filter((permission) =>
    hasPermission(role, permission)
  );
}

/**
 * Validate if role is valid
 * @param {string} role - Role to validate
 * @returns {boolean}
 */
export function isValidRole(role) {
  return role in ROLE_HIERARCHY;
}

/**
 * Get role display name
 * @param {string} role - Role key
 * @returns {string} Display name
 */
export function getRoleDisplayName(role) {
  const displayNames = {
    owner: "Owner",
    admin: "Administrator",
    manager: "Manager",
    member: "Member",
    viewer: "Viewer",
  };

  return displayNames[role] || role;
}

/**
 * Get role description
 * @param {string} role - Role key
 * @returns {string} Description
 */
export function getRoleDescription(role) {
  const descriptions = {
    owner:
      "Full access to all features. Can delete organization and change ownership.",
    admin: "Can manage members, configure settings, and access all features.",
    manager:
      "Can assign tasks, view analytics, and manage day-to-day operations.",
    member: "Can create SOS alerts, view analytics, and use core features.",
    viewer: "Read-only access to organization data and activities.",
  };

  return descriptions[role] || "";
}

/**
 * Get available roles with their metadata
 * @returns {Array} Array of role objects
 */
export function getAvailableRoles() {
  return [
    {
      key: "owner",
      name: getRoleDisplayName("owner"),
      description: getRoleDescription("owner"),
      level: ROLE_HIERARCHY.owner,
      badge: "👑",
      color: "text-yellow-400",
    },
    {
      key: "admin",
      name: getRoleDisplayName("admin"),
      description: getRoleDescription("admin"),
      level: ROLE_HIERARCHY.admin,
      badge: "⚡",
      color: "text-purple-400",
    },
    {
      key: "manager",
      name: getRoleDisplayName("manager"),
      description: getRoleDescription("manager"),
      level: ROLE_HIERARCHY.manager,
      badge: "📊",
      color: "text-blue-400",
    },
    {
      key: "member",
      name: getRoleDisplayName("member"),
      description: getRoleDescription("member"),
      level: ROLE_HIERARCHY.member,
      badge: "👤",
      color: "text-green-400",
    },
    {
      key: "viewer",
      name: getRoleDisplayName("viewer"),
      description: getRoleDescription("viewer"),
      level: ROLE_HIERARCHY.viewer,
      badge: "👁️",
      color: "text-gray-400",
    },
  ];
}
