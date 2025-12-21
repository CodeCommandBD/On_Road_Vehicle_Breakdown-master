import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "member", "viewer"],
      default: "member",
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      title: String,
      department: String,
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for uniqueness and query optimization
teamMemberSchema.index({ organization: 1, user: 1 }, { unique: true });
teamMemberSchema.index({ organization: 1, role: 1 });
teamMemberSchema.index({ user: 1, isActive: 1 });
teamMemberSchema.index({ organization: 1, isActive: 1, joinedAt: -1 });

// Virtual for user details
teamMemberSchema.virtual("userDetails", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: true,
});

// Method to check if user has permission
teamMemberSchema.methods.hasPermission = function (permission) {
  // Owner and admin have all permissions
  if (this.role === "owner" || this.role === "admin") {
    return true;
  }

  // Check specific permissions
  return this.permissions.includes(permission);
};

// Method to check if role can perform action
teamMemberSchema.statics.canPerformAction = function (role, action) {
  const roleHierarchy = {
    owner: 5,
    admin: 4,
    manager: 3,
    member: 2,
    viewer: 1,
  };

  const actionRequirements = {
    "org:write": 4, // admin or owner
    "members:invite": 4,
    "members:remove": 4,
    "members:change_role": 5, // owner only
    "webhook:configure": 4,
    "settings:modify": 4,
    "analytics:view": 2, // all can view
    "sos:create": 2,
  };

  return roleHierarchy[role] >= (actionRequirements[action] || 0);
};

// Update lastActiveAt
teamMemberSchema.methods.updateActivity = function () {
  this.lastActiveAt = new Date();
  return this.save();
};

const TeamMember =
  mongoose.models.TeamMember || mongoose.model("TeamMember", teamMemberSchema);

export default TeamMember;
