const fs = require("fs");
const path = require("path");

// Files to update with their routing type
const filesToUpdate = [
  // User Dashboard - i18n
  { path: "app/[locale]/user/dashboard/layout.jsx", i18n: true },
  { path: "app/[locale]/user/billing/page.jsx", i18n: true },

  // User Dashboard - Regular
  { path: "app/[locale]/user/dashboard/team/page.jsx", i18n: false },
  { path: "app/[locale]/user/dashboard/team/create/page.jsx", i18n: false },
  {
    path: "app/[locale]/user/dashboard/predictive-maintenance/page.jsx",
    i18n: false,
  },
  { path: "app/[locale]/user/dashboard/bookings/[id]/page.jsx", i18n: false },

  // Trial & Pricing
  { path: "app/[locale]/trial/activate/page.jsx", i18n: false },
  { path: "app/[locale]/trial/success/page.jsx", i18n: false },
  { path: "app/[locale]/pricing/page.jsx", i18n: false },

  // Payment
  { path: "app/[locale]/payment/fail/page.jsx", i18n: false },
  { path: "app/[locale]/payment/success/page.jsx", i18n: false },

  // Auth
  { path: "app/[locale]/reset-password/page.jsx", i18n: false },
  { path: "app/[locale]/forgot-password/page.jsx", i18n: false },

  // Checkout
  { path: "app/[locale]/checkout/page.jsx", i18n: false },
  { path: "app/[locale]/checkout/[planId]/page.jsx", i18n: false },

  // Booking
  { path: "app/[locale]/book/page.jsx", i18n: false },

  // Mechanic - i18n
  { path: "app/[locale]/mechanic/layout.jsx", i18n: true },

  // Mechanic - Regular
  { path: "app/[locale]/mechanic/dashboard/jobs/page.jsx", i18n: false },
  {
    path: "app/[locale]/mechanic/dashboard/bookings/[id]/page.jsx",
    i18n: false,
  },

  // Garage
  { path: "app/[locale]/garage/dashboard/layout.jsx", i18n: false },
  { path: "app/[locale]/garage/dashboard/subscription/page.jsx", i18n: false },
  { path: "app/[locale]/garage/dashboard/bookings/[id]/page.jsx", i18n: false },
  {
    path: "app/[locale]/garage/dashboard/bookings/[id]/track/page.jsx",
    i18n: false,
  },
  { path: "app/[locale]/garage/sos-navigation/[id]/page.jsx", i18n: false },

  // Admin
  { path: "app/[locale]/admin/layout.jsx", i18n: false },
  { path: "app/[locale]/admin/bookings/[id]/page.jsx", i18n: false },

  // Public
  { path: "app/[locale]/(main)/garages/page.jsx", i18n: false },
  {
    path: "app/[locale]/(main)/garages/[id]/GarageDetailsClient.jsx",
    i18n: false,
  },

  // Other
  { path: "app/[locale]/invite/accept/page.jsx", i18n: false },
];

const projectRoot = path.join(__dirname, "..");

function updateFile(filePath, useI18n) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  let modified = false;

  // Pattern 1: import { useRouter } from "next/navigation";
  if (content.includes('import { useRouter } from "next/navigation"')) {
    content = content.replace(
      'import { useRouter } from "next/navigation"',
      'import { useRouterWithLoading } from "@/hooks/useRouterWithLoading"'
    );
    modified = true;
  }

  // Pattern 2: import { useRouter } from "@/i18n/routing";
  if (content.includes('import { useRouter } from "@/i18n/routing"')) {
    content = content.replace(
      'import { useRouter } from "@/i18n/routing"',
      'import { useRouterWithLoading } from "@/hooks/useRouterWithLoading"'
    );
    modified = true;
  }

  // Pattern 3: const router = useRouter();
  if (content.includes("const router = useRouter()")) {
    const replacement = useI18n
      ? "const router = useRouterWithLoading(true); // i18n routing"
      : "const router = useRouterWithLoading(); // Regular routing";

    content = content.replace(/const router = useRouter\(\);/g, replacement);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  Skipped (no changes needed): ${filePath}`);
    return false;
  }
}

console.log("🚀 Starting batch update of router hooks...\n");

let successCount = 0;
let failCount = 0;
let skipCount = 0;

filesToUpdate.forEach(({ path: filePath, i18n }) => {
  const result = updateFile(filePath, i18n);
  if (result === true) {
    successCount++;
  } else if (result === false) {
    skipCount++;
  } else {
    failCount++;
  }
});

console.log("\n📊 Summary:");
console.log(`✅ Successfully updated: ${successCount} files`);
console.log(`⏭️  Skipped: ${skipCount} files`);
console.log(`❌ Failed: ${failCount} files`);
console.log(`📁 Total processed: ${filesToUpdate.length} files`);

console.log("\n✨ Migration complete!");
console.log("📝 Check docs/LOADING_ROUTER_MIGRATION.md for details");
