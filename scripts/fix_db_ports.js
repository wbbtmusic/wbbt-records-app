const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/database.sqlite');
const db = new Database(dbPath);

console.log('Fixing database URLs...');

// Fix Files table
const files = db.prepare('SELECT * FROM files WHERE url LIKE "%:3001%"').all();
console.log(`Found ${files.length} files with port 3001`);

const updateFile = db.prepare('UPDATE files SET url = ? WHERE id = ?');
for (const file of files) {
    const newUrl = file.url.replace(':3001', ':3030');
    updateFile.run(newUrl, file.id);
}

// Fix Tracks table (fileUrl)
const tracks = db.prepare('SELECT * FROM tracks WHERE fileUrl LIKE "%:3001%"').all();
console.log(`Found ${tracks.length} tracks with port 3001`);

const updateTrack = db.prepare('UPDATE tracks SET fileUrl = ? WHERE id = ?');
for (const track of tracks) {
    const newUrl = track.fileUrl.replace(':3001', ':3030');
    updateTrack.run(newUrl, track.id);
}

// Fix Releases table (coverUrl)
const releases = db.prepare('SELECT * FROM releases WHERE coverUrl LIKE "%:3001%"').all();
console.log(`Found ${releases.length} releases with port 3001`);

const updateRelease = db.prepare('UPDATE releases SET coverUrl = ? WHERE id = ?');
for (const rel of releases) {
    const newUrl = rel.coverUrl.replace(':3001', ':3030');
    updateRelease.run(newUrl, rel.id);
}

console.log('Database URLs fixed.');
