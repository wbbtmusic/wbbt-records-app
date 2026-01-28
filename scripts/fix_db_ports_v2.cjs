const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/wbbt.sqlite');
console.log(`Opening DB at ${dbPath}`);
const db = new Database(dbPath);

console.log('Fixing Releases...');
try {
    // Only fetch ID and cover_url to avoid schema issues with SELECT *
    const releases = db.prepare("SELECT id, cover_url FROM releases WHERE cover_url LIKE '%3001%'").all();
    console.log(`Found ${releases.length} releases to fix.`);

    const update = db.prepare("UPDATE releases SET cover_url = ? WHERE id = ?");

    let count = 0;
    for (const r of releases) {
        if (!r.cover_url) continue;
        const newUrl = r.cover_url.replace('3001', '3030');
        update.run(newUrl, r.id);
        count++;
    }
    console.log(`Fixed ${count} releases.`);
} catch (e) {
    console.error('Error fixing releases:', e.message);
}

console.log('Done.');
