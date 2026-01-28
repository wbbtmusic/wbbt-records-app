const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/wbbt.sqlite');
console.log(`Opening database at: ${dbPath}`);
const db = new Database(dbPath);

console.log('Fixing database URLs...');

try {
    // 1. Files table: Does NOT have a URL column. It is dynamic. Skipped.

    // 2. Tracks table: Has 'file_url'
    const tracks = db.prepare('SELECT * FROM tracks WHERE file_url LIKE "%:3001%"').all();
    console.log(`Found ${tracks.length} tracks with port 3001`);

    const updateTrack = db.prepare('UPDATE tracks SET file_url = ? WHERE id = ?');
    for (const track of tracks) {
        const newUrl = track.file_url.replace(':3001', ':3030');
        updateTrack.run(newUrl, track.id);
    }

    // 3. Releases table: Has 'cover_url'
    const releases = db.prepare('SELECT * FROM releases WHERE cover_url LIKE "%:3001%"').all();
    console.log(`Found ${releases.length} releases with port 3001`);

    const updateRelease = db.prepare('UPDATE releases SET cover_url = ? WHERE id = ?');
    for (const rel of releases) {
        const newUrl = rel.cover_url.replace(':3001', ':3030');
        updateRelease.run(newUrl, rel.id);
    }

    console.log('Database URLs fixed successfully.');
} catch (error) {
    console.error('Error fixing database:', error);
}
