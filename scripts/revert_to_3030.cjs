const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/wbbt.sqlite');
console.log(`Opening DB at ${dbPath}`);
const db = new Database(dbPath);

console.log('Migrating URLs back to Port 3030...');

try {
    // Fix Tracks: Replace 3040 with 3030
    let tracks = db.prepare("SELECT id, file_url FROM tracks WHERE file_url LIKE '%:3040%'").all();
    console.log(`Found ${tracks.length} tracks to revert.`);

    const updateTrack = db.prepare("UPDATE tracks SET file_url = ? WHERE id = ?");
    for (const t of tracks) {
        let newUrl = t.file_url.replace(':3040', ':3030');
        updateTrack.run(newUrl, t.id);
    }

    // Fix Releases: Replace 3040 with 3030
    let releases = db.prepare("SELECT id, cover_url FROM releases WHERE cover_url LIKE '%:3040%'").all();
    console.log(`Found ${releases.length} releases to revert.`);

    const updateRelease = db.prepare("UPDATE releases SET cover_url = ? WHERE id = ?");
    for (const r of releases) {
        let newUrl = r.cover_url.replace(':3040', ':3030');
        updateRelease.run(newUrl, r.id);
    }

    console.log('Migration back to 3030 complete.');

} catch (e) {
    console.error('Migration failed:', e.message);
}
