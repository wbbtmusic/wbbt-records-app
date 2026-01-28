const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/wbbt.sqlite');
const db = new Database(dbPath);

console.log('Inspecting Table Columns...');

const tables = ['tracks', 'releases', 'files'];

tables.forEach(table => {
    try {
        const columns = db.pragma(`table_info(${table})`);
        console.log(`\nTable: ${table}`);
        columns.forEach(col => console.log(` - ${col.name} (${col.type})`));
    } catch (e) {
        console.log(`Table ${table} inspection failed:`, e.message);
    }
});
