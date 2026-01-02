const fs = require("fs");
const path = require("path");

console.log("🔒 Re-enabling Rate Limiting...\n");

const filePath = path.join(__dirname, "../app/api/auth/login/route.js");

try {
  let content = fs.readFileSync(filePath, "utf8");

  // Remove TESTING comments
  content = content.replace(
    /\s*\/\/ TEMPORARILY DISABLED FOR TESTING - TODO: Re-enable before production\n/g,
    ""
  );
  content = content.replace(/\s*\/\*\n/g, "");
  content = content.replace(/\s*\*\/\n/g, "");

  // Remove testing-only error line
  content = content.replace(
    /\s*\/\/ Simple error without rate limiting \(TESTING ONLY\)\n\s*throw new UnauthorizedError\(MESSAGES\.ERROR\.INVALID_CREDENTIALS\);\n/g,
    ""
  );

  fs.writeFileSync(filePath, content);

  console.log("✅ Rate limiting has been re-enabled!");
  console.log("📁 File updated: app/api/auth/login/route.js");
  console.log(
    "\n⚠️  Please review the changes before deploying to production."
  );
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
