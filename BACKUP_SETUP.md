# Automated Database Backup Setup

## How to Setup Automated Daily Backups

### Option 1: Using Vercel Cron Jobs (Recommended for Vercel deployment)

1. Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/admin/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. Add to `.env`:

```
CRON_SECRET=your-random-secret-key-here
```

3. Deploy to Vercel - backups will run daily at 2 AM

### Option 2: Using External Cron Service (EasyCron, cron-job.org)

1. Sign up at https://www.easycron.com/ or https://cron-job.org

2. Create new cron job:

   - URL: `https://yourdomain.com/api/admin/backup`
   - Schedule: `0 2 * * *` (2 AM daily)
   - Add header: `Authorization: Bearer YOUR_CRON_SECRET`

3. Add to `.env`:

```
CRON_SECRET=your-random-secret-key-here
```

### Option 3: Manual Backup via Admin Panel

Access: `https://yourdomain.com/api/admin/backup`

- Requires admin login
- Click "Create Backup" button
- Download backup file

## Backup Location

Backups are stored in: `project-root/backups/`

## Backup Retention

- Automatically keeps last 7 backups
- Older backups are deleted automatically

## Restore from Backup

```bash
# Navigate to backup directory
cd backups/backup-2024-01-01-02-00-00

# Restore using mongorestore
mongorestore --uri="your-mongodb-uri" --gzip
```

## Requirements

- MongoDB Database Tools must be installed
- Download: https://www.mongodb.com/try/download/database-tools
