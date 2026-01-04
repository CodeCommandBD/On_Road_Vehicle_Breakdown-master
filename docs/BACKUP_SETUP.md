# 💾 Backup Automation Guide

This guide explains how to set up automated backups for the **On-Road Vehicle Breakdown** platform's MongoDB database.

## Strategy

We rely on **MongoDB Atlas** for primary backups and a custom scheduled task (Cron Job) for creating portable archives.

## 1. MongoDB Atlas Automated Backups

If you are using a paid MongoDB Atlas tier (M10+), automated backups are enabled by default.

- **Continuous Backups**: Point-in-time recovery.
- **Snapshots**: Daily/weekly snapshots.
- **Retention**: Configure retention policy in Atlas Settings.

## 2. Manual/Scripted Backups (Free Tier / Extra Safety)

For the M0 (Free) tier or additional redundancy, we use a script to dump the database and upload it to a secure storage (e.g., AWS S3 or Google Drive).

### Backup Script (`scripts/backup.js`)

This project includes a backup utility using `mongodump`.

#### Prerequisites

- `mongodump` installed on the server (or container).
- Storage bucket credentials.

#### Setup (GitHub Actions Example)

You can automate this via GitHub Actions. Create `.github/workflows/backup.yaml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: "0 0 * * *" # Every day at midnight

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: MongoDB Backup
        uses: github/mongodb-backup-action@v1
        with:
          connection-string: ${{ secrets.MONGODB_URI }}
          backup-directory: "backups"
      # Add step to upload to S3/Drive
```

## 3. Disaster Recovery

In case of data loss:

1. **Atlas Restore**:

   - Go to Atlas Dashboard -> Clusters -> Backup.
   - Click "Restore" on the desired snapshot.
   - Choose to restore to the existing cluster or a new one.

2. **Manual Restore**:
   - Locate your `.bson` or `.gzip` backup file.
   - Run `mongorestore`:
     ```bash
     mongorestore --uri="your_mongodb_uri" --archive="backup_file.gzip" --gzip
     ```

---

[← Back to README](../README.md)
