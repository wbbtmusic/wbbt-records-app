
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'server', 'wbbt.sqlite');
const UPLOADS_DIR = path.join(__dirname, 'server', 'uploads');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = OFF');

console.log('Starting system cleanup...');

try {
    // 1. Get non-admin users
    const users = db.prepare("SELECT id, email FROM users WHERE role != 'admin'").all();
    console.log(`Found ${users.length} non-admin users to delete.`);

    if (users.length === 0) {
        console.log('No non-admin users found. System is clean.');
        process.exit(0);
    }

    for (const user of users) {
        const userId = user.id;
        console.log(`Cleaning up user: ${user.email} (${userId})`);

        // 2. Collect files to delete
        const filesToDelete = new Set<string>();

        // From files table
        const dbFiles = db.prepare('SELECT stored_name FROM files WHERE user_id = ?').all(userId);
        dbFiles.forEach((f: any) => {
            if (f.stored_name) filesToDelete.add(f.stored_name);
        });

        // From releases (covers) - check if local path
        const releases = db.prepare('SELECT cover_url, documents FROM releases WHERE user_id = ?').all(userId);
        releases.forEach((r: any) => {
            if (r.cover_url && r.cover_url.includes('/uploads/')) {
                const basename = path.basename(r.cover_url);
                filesToDelete.add(basename);
            }
            if (r.documents) {
                try {
                    const docs = JSON.parse(r.documents);
                    docs.forEach((d: string) => {
                        if (d.includes('/uploads/')) filesToDelete.add(path.basename(d));
                    });
                } catch { }
            }
        });

        // From tracks
        const userTracks = db.prepare('SELECT file_url FROM tracks WHERE release_id IN (SELECT id FROM releases WHERE user_id = ?)').all(userId);
        userTracks.forEach((t: any) => {
            if (t.file_url && t.file_url.includes('/uploads/')) {
                filesToDelete.add(path.basename(t.file_url));
            }
        });

        // 3. Delete Database Records
        const deleteOps = [
            'DELETE FROM applications WHERE user_id = ?',
            'DELETE FROM earnings WHERE user_id = ?',
            'DELETE FROM withdrawals WHERE user_id = ?',
            'DELETE FROM notifications WHERE user_id = ?',
            'DELETE FROM payment_methods WHERE user_id = ?',
            'DELETE FROM files WHERE user_id = ?',
            'DELETE FROM ticket_responses WHERE user_id = ?',
        ];

        // Complex deletes
        // Delete responses to user's tickets
        const userTicketIds = db.prepare('SELECT id FROM tickets WHERE user_id = ?').all(userId).map((t: any) => t.id);
        if (userTicketIds.length > 0) {
            const placeholders = userTicketIds.map(() => '?').join(',');
            db.prepare(`DELETE FROM ticket_responses WHERE ticket_id IN (${placeholders})`).run(...userTicketIds);
        }
        db.prepare('DELETE FROM tickets WHERE user_id = ?').run(userId);

        // Delete tracks
        db.prepare('DELETE FROM tracks WHERE release_id IN (SELECT id FROM releases WHERE user_id = ?)').run(userId);

        // Delete releases
        db.prepare('DELETE FROM releases WHERE user_id = ?').run(userId);

        // Run standard deletes
        deleteOps.forEach(sql => db.prepare(sql).run(userId));

        // Delete User
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        // 4. Delete Physical Files
        let deletedFilesCount = 0;
        filesToDelete.forEach(filename => {
            const filePath = path.join(UPLOADS_DIR, filename);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    deletedFilesCount++;
                }
            } catch (err) {
                console.error(`Failed to delete file ${filename}:`, err);
            }
        });
        console.log(`  - Deleted ${deletedFilesCount} physical files.`);
    }

    console.log('Cleanup completed successfully.');

} catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
}
