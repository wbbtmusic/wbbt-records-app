const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/wbbt.sqlite');
const db = new Database(dbPath);

console.log('--- Tracks (file_url) ---');
try {
    const tracks = db.prepare('SELECT id, file_url FROM tracks LIMIT 5').all();
    console.log(tracks);
} catch (e) { console.log('Error reading tracks:', e.message); }

console.log('\n--- Releases (cover_url) ---');
try {
    const releases = db.prepare('SELECT id, cover_url FROM releases LIMIT 5').all();
    console.log(releases);
} catch (e) {
    console.log('Error reading releases:', e.message);
    // Try CamelCase just in case
    try {
        const releasesCamel = db.prepare('SELECT id, coverUrl FROM releases LIMIT 5').all();
        console.log('Found camelCase coverUrl:', releasesCamel);
    } catch (e2) { console.log('Error reading releases (camelCase):', e2.message); }
}
