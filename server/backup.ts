import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';
import { db, closeDb, initDb } from './database';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..'); // Root of project
const DB_PATH = path.join(__dirname, 'wbbt.sqlite');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

export const createBackup = (res: any) => {
    // Flush WAL data to main database file before backing up
    try {
        if (db) {
            console.log('Checkpointing database...');
            db.pragma('wal_checkpoint(TRUNCATE)');
        }
    } catch (e) {
        console.error('Checkpoint failed:', e);
    }

    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    res.attachment(`wbbt-backup-${Date.now()}.zip`);

    archive.pipe(res);

    // Append database file
    if (fs.existsSync(DB_PATH)) {
        archive.file(DB_PATH, { name: 'server/wbbt.sqlite' });
    }

    // Append uploads directory
    if (fs.existsSync(UPLOADS_DIR)) {
        archive.directory(UPLOADS_DIR, 'server/uploads');
    }

    archive.finalize();
};

export const restoreBackup = async (zipFilePath: string) => {
    try {
        console.log('Starting restore process...');

        // 1. Close Database
        console.log('Closing database connection...');
        closeDb();

        // 2. Cleanup WAL files to prevent corruption with new DB
        const WAL_PATH = `${DB_PATH}-wal`;
        const SHM_PATH = `${DB_PATH}-shm`;
        if (fs.existsSync(WAL_PATH)) fs.unlinkSync(WAL_PATH);
        if (fs.existsSync(SHM_PATH)) fs.unlinkSync(SHM_PATH);

        // 3. Extract Zip
        console.log('Extracting backup...');
        const zip = new AdmZip(zipFilePath);
        zip.extractAllTo(ROOT_DIR, true); // true = overwrite

        console.log('Extraction complete.');

        // 4. Restart Database
        console.log('Restarting database...');
        initDb();

        return { success: true };
    } catch (error) {
        console.error('Restore failed:', error);
        // Try to reopen DB if it failed mid-way
        try { initDb(); } catch (e) { }
        throw error;
    }
};
