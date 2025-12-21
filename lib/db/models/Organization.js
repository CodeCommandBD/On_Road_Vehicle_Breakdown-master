import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    settings: {
      webhookUrl: {
        type: String,
        trim: true,
      },
      webhookSecret: {
        type: String,
      },
      webhookEvents: {
        type: [String],
        default: ["sos.created", "sos.updated"],
      },
      webhookActive: {
        type: Boolean,
        default: false,
      },
      branding: {
        logo: String,
        primaryColor: String,
        secondaryColor: String,
      },
    },
    billingInfo: {
      contactName: String,
      contactEmail: String,
      contactPhone: String,
      address: String,
      taxId: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    memberCount: {
      type: Number,
      default: 1,
    },
    metadata: {
      industry: String,
      companySize: String,
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
organizationSchema.index({ owner: 1 });
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ isActive: 1, createdAt: -1 });

// Virtual for members
organizationSchema.virtual("members", {
  ref: "TeamMember",
  localField: "_id",
  foreignField: "organization",
});

// Method to generate unique slug
organizationSchema.statics.generateSlug = async function (name) {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let uniqueSlug = slug;
  let counter = 1;

  while (await this.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};

// Set to public JSON
organizationSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    memberCount: this.memberCount,
    isActive: this.isActive,
    settings: this.settings,
    createdAt: this.createdAt,
  };
};

// In development, delete the model from mongoose to re-register with new schema
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Organization;
}

const Organization =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);

export default Organization;
