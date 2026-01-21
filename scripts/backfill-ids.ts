import { sqlite } from '../server/database.js';

console.log('Starting Backfill Process...');

// 1. Backfill WUPC for Releases
const releases = sqlite.getAllReleases();
let releasesUpdated = 0;

for (const release of releases) {
    if (!release.wupc) {
        // Generate WUPC
        const wupc = `WBBT${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        // Update DB using exposed db object
        sqlite.db.prepare('UPDATE releases SET wupc = ? WHERE id = ?').run(wupc, release.id);
        releasesUpdated++;
        console.log(`Updated Release ${release.title} with WUPC: ${wupc}`);
    }
}

console.log(`Releases Backfilled: ${releasesUpdated}`);

// 2. Backfill WISRC for Tracks
// Use exposed db to get all tracks since getAllTracks doesn't exist
const allTracks = sqlite.db.prepare('SELECT * FROM tracks').all();
let tracksUpdated = 0;

for (const track of allTracks) {
    if (!track.wisrc) {
        // Generate WISRC
        // Format: WTRK + timestamp suffix + random
        const wisrc = `WTRK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

        sqlite.db.prepare('UPDATE tracks SET wisrc = ? WHERE id = ?').run(wisrc, track.id);
        tracksUpdated++;
        console.log(`Updated Track ${track.title} with WISRC: ${wisrc}`);
    }
}

console.log(`Tracks Backfilled: ${tracksUpdated}`);
console.log('Backfill Complete.');
