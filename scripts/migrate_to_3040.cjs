const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/wbbt.sqlite');
console.log(`Opening DB at ${dbPath}`);
const db = new Database(dbPath);

console.log('Migrating URLs to Port 3040...');

try {
    // Fix Tracks: Replace 3001 AND 3030 with 3040
    let tracks = db.prepare("SELECT id, file_url FROM tracks WHERE file_url LIKE '%:3001%' OR file_url LIKE '%:3030%'").all();
    console.log(`Found ${tracks.length} tracks to fix.`);

    const updateTrack = db.prepare("UPDATE tracks SET file_url = ? WHERE id = ?");
    for (const t of tracks) {
        let newUrl = t.file_url.replace(':3001', ':3040').replace(':3030', ':3040');
        updateTrack.run(newUrl, t.id);
    }

    // Fix Releases: Replace 3001 AND 3030 with 3040
    let releases = db.prepare("SELECT id, cover_url FROM releases WHERE cover_url LIKE '%:3001%' OR cover_url LIKE '%:3030%'").all();
    console.log(`Found ${releases.length} releases to fix.`);

    const updateRelease = db.prepare("UPDATE releases SET cover_url = ? WHERE id = ?");
    for (const r of releases) {
        let newUrl = r.cover_url.replace(':3001', ':3040').replace(':3030', ':3040');
        updateRelease.run(newUrl, r.id);
    }

    console.log('Migration to 3040 complete.');

} catch (e) {
    console.error('Migration failed:', e.message);
}
