const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/wbbt.sqlite');
const db = new Database(dbPath);

console.log('--- Checking DB for 3001 ---');
try {
    // Check Tracks
    const tracks = db.prepare("SELECT id, file_url FROM tracks WHERE file_url LIKE '%3001%'").all();
    console.log(`Tracks with 3001: ${tracks.length}`);
    if (tracks.length > 0) console.log(tracks[0]);

    // Check Releases
    const releases = db.prepare("SELECT id, cover_url FROM releases WHERE cover_url LIKE '%3001%'").all();
    console.log(`Releases with 3001: ${releases.length}`);
    if (releases.length > 0) console.log(releases[0]);
} catch (e) {
    console.error(e.message);
}
