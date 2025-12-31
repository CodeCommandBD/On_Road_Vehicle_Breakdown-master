/**
 * Automated Database Backup Service
 * Creates MongoDB backups and optionally uploads to cloud storage
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { logAction, AUDIT_ACTIONS, SEVERITY } from "./auditLog";

const execAsync = promisify(exec);

/**
 * Backup configuration
 */
const BACKUP_CONFIG = {
  BACKUP_DIR: path.join(process.cwd(), "backups"),
  MONGODB_URI: process.env.MONGODB_URI,
  MAX_BACKUPS: 7, // Keep last 7 backups
  COMPRESSION: true,
};

/**
 * Ensure backup directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_CONFIG.BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_CONFIG.BACKUP_DIR, { recursive: true });
  }
}

/**
 * Generate backup filename
 * @returns {string} Backup filename
 */
function generateBackupFilename() {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, "-").split("T")[0];
  const time = date.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `backup-${timestamp}-${time}`;
}

/**
 * Create MongoDB backup using mongodump
 * @param {string} performedBy - User ID who triggered backup
 * @returns {Promise<object>} Backup result
 */
export async function createMongoDBBackup(performedBy = null) {
  try {
    ensureBackupDir();

    const backupName = generateBackupFilename();
    const backupPath = path.join(BACKUP_CONFIG.BACKUP_DIR, backupName);

    console.log(`📦 Starting MongoDB backup: ${backupName}`);

    // Check if mongodump is available
    try {
      await execAsync("mongodump --version");
    } catch (error) {
      throw new Error(
        "mongodump not found. Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools"
      );
    }

    // Build mongodump command
    let command = `mongodump --uri="${BACKUP_CONFIG.MONGODB_URI}" --out="${backupPath}"`;

    if (BACKUP_CONFIG.COMPRESSION) {
      command += " --gzip";
    }

    // Execute backup
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes("done dumping")) {
      console.error("Backup stderr:", stderr);
    }

    console.log("Backup stdout:", stdout);

    // Get backup size
    const stats = await getDirectorySize(backupPath);

    // Clean old backups
    await cleanOldBackups();

    // Log backup creation
    await logAction({
      action: AUDIT_ACTIONS.BACKUP_CREATED,
      performedBy,
      targetModel: "System",
      targetId: null,
      changes: {
        backupName,
        backupPath,
        sizeBytes: stats.size,
        sizeMB: (stats.size / 1024 / 1024).toFixed(2),
      },
      severity: SEVERITY.MEDIUM,
    });

    console.log(`✅ Backup created successfully: ${backupName}`);

    return {
      success: true,
      backupName,
      backupPath,
      size: stats.size,
      sizeMB: (stats.size / 1024 / 1024).toFixed(2),
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Backup creation error:", error);
    throw error;
  }
}

/**
 * Get directory size recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<object>} Size info
 */
async function getDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;

  function calculateSize(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    calculateSize(dirPath);
  }

  return { size: totalSize, fileCount };
}

/**
 * Clean old backups (keep only MAX_BACKUPS)
 */
async function cleanOldBackups() {
  try {
    const backups = fs
      .readdirSync(BACKUP_CONFIG.BACKUP_DIR)
      .filter((file) => file.startsWith("backup-"))
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_CONFIG.BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_CONFIG.BACKUP_DIR, file)).mtime,
      }))
      .sort((a, b) => b.time - a.time);

    // Delete old backups
    if (backups.length > BACKUP_CONFIG.MAX_BACKUPS) {
      const toDelete = backups.slice(BACKUP_CONFIG.MAX_BACKUPS);

      for (const backup of toDelete) {
        console.log(`🗑️ Deleting old backup: ${backup.name}`);
        fs.rmSync(backup.path, { recursive: true, force: true });
      }

      console.log(`Cleaned ${toDelete.length} old backups`);
    }
  } catch (error) {
    console.error("Error cleaning old backups:", error);
  }
}

/**
 * List all available backups
 * @returns {Array} List of backups
 */
export function listBackups() {
  try {
    ensureBackupDir();

    const backups = fs
      .readdirSync(BACKUP_CONFIG.BACKUP_DIR)
      .filter((file) => file.startsWith("backup-"))
      .map((file) => {
        const filePath = path.join(BACKUP_CONFIG.BACKUP_DIR, file);
        const stats = fs.statSync(filePath);

        return {
          name: file,
          path: filePath,
          size: stats.size,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return backups;
  } catch (error) {
    console.error("Error listing backups:", error);
    return [];
  }
}

/**
 * Delete a specific backup
 * @param {string} backupName - Backup name
 * @param {string} performedBy - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteBackup(backupName, performedBy = null) {
  try {
    const backupPath = path.join(BACKUP_CONFIG.BACKUP_DIR, backupName);

    if (!fs.existsSync(backupPath)) {
      throw new Error("Backup not found");
    }

    // Get size before deletion
    const stats = await getDirectorySize(backupPath);

    // Delete backup
    fs.rmSync(backupPath, { recursive: true, force: true });

    // Log deletion
    await logAction({
      action: "backup_deleted",
      performedBy,
      targetModel: "System",
      targetId: null,
      changes: {
        backupName,
        sizeMB: (stats.size / 1024 / 1024).toFixed(2),
      },
      severity: SEVERITY.HIGH,
    });

    console.log(`✅ Backup deleted: ${backupName}`);
    return true;
  } catch (error) {
    console.error("Error deleting backup:", error);
    throw error;
  }
}
