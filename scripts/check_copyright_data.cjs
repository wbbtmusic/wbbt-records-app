const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/wbbt.sqlite');
const db = new Database(dbPath);

console.log('--- Checking Copyright Data ---');
try {
    const checks = db.prepare("SELECT * FROM copyright_checks").all();
    console.log(`Total Checks: ${checks.length}`);
    if (checks.length > 0) {
        console.log('Sample Check:', checks[0]);
    } else {
        console.log('No copyright checks found. Analysis might not be triggering.');
    }

    // Check if we have tracks to analyze
    const tracks = db.prepare("SELECT id, title, file_url FROM tracks LIMIT 5").all();
    console.log('\n--- Recent Tracks ---');
    console.log(tracks);

} catch (e) {
    console.error(e.message);
}
