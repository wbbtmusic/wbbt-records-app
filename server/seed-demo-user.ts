import { sqlite } from './database.js';
import bcrypt from 'bcryptjs';

const seedDemo = () => {
    console.log('🚀 Seeding Demo User Data...');

    const demoEmail = 'demo@wbbt.net';
    const demoPass = 'demo123';
    const demoId = 'user-demo-999';

    // 1. Create Demo User
    const existing = sqlite.getUserByEmail(demoEmail);
    if (existing) {
        console.log('User already exists, deleting and recreating for clean state...');
        sqlite.db.prepare('DELETE FROM users WHERE id = ?').run(demoId);
    }

    const hashedPassword = bcrypt.hashSync(demoPass, 10);
    sqlite.db.prepare(`
        INSERT INTO users (id, email, password, first_name, last_name, artist_name, role, application_status, balance)
        VALUES (?, ?, ?, ?, ?, ?, 'user', 'APPROVED', 1245.50)
    `).run(demoId, demoEmail, hashedPassword, 'Demo', 'Artist', 'Sunset Echoes');

    // 2. Create a Sample Release
    const relId = 'rel-demo-1';
    sqlite.db.prepare('DELETE FROM releases WHERE id = ?').run(relId);
    sqlite.db.prepare(`
        INSERT INTO releases (id, user_id, title, type, genre, sub_genre, status, cover_url, release_date, created_at, distributed_before)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        relId, demoId, 'Midnight Journey', 'Single', 'Electronic', 'Synthwave', 'APPROVED',
        'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400',
        '2024-03-01', new Date().toISOString(), 0
    );

    // 3. Add a Track
    const trackId = 'trk-demo-1';
    sqlite.db.prepare('DELETE FROM tracks WHERE id = ?').run(trackId);
    sqlite.db.prepare(`
        INSERT INTO tracks (id, release_id, title, version, isrc, language, is_explicit, track_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(trackId, relId, 'Midnight Journey', 'Original Mix', 'TRDEM24001', 'English', 0, 1);

    // 4. Add Artist to Track
    sqlite.db.prepare('DELETE FROM track_artists WHERE track_id = ?').run(trackId);
    sqlite.db.prepare(`
        INSERT INTO track_artists (id, track_id, name, role, artist_order)
        VALUES (?, ?, ?, ?, ?)
    `).run('ta-demo-1', trackId, 'Sunset Echoes', 'Primary Artist', 0);

    // 5. Add Earnings History (last 4 months)
    sqlite.db.prepare('DELETE FROM earnings WHERE user_id = ?').run(demoId);
    const months = ['2023-12', '2024-01', '2024-02', '2024-03'];
    const amounts = [210.40, 345.20, 420.10, 269.80];
    const streams = [12000, 24000, 31000, 18000];

    months.forEach((m, i) => {
        sqlite.db.prepare(`
            INSERT INTO earnings (id, user_id, month, amount, streams)
            VALUES (?, ?, ?, ?, ?)
        `).run(`earn-demo-${i}`, demoId, m, amounts[i], streams[i]);
    });

    // 6. Add Listener History (last 30 days daily mock)
    sqlite.db.prepare('DELETE FROM monthly_listeners_history WHERE user_id = ?').run(demoId);
    // Let's add specific months for the chart
    const historyData = [
        { month: 'Oct', year: 2023, ml: 8500, fl: 1200 },
        { month: 'Nov', year: 2023, ml: 12000, fl: 1500 },
        { month: 'Dec', year: 2023, ml: 15500, fl: 1800 },
        { month: 'Jan', year: 2024, ml: 19000, fl: 2100 },
        { month: 'Feb', year: 2024, ml: 24000, fl: 2500 },
        { month: 'Mar', year: 2024, ml: 28500, fl: 3100 },
    ];

    historyData.forEach((h, i) => {
        sqlite.db.prepare(`
            INSERT INTO monthly_listeners_history (id, user_id, platform, month, year, monthly_listeners, followers)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(`ml-demo-s-${i}`, demoId, 'spotify', h.month, h.year, h.ml, h.fl);

        sqlite.db.prepare(`
            INSERT INTO monthly_listeners_history (id, user_id, platform, month, year, monthly_listeners, subscribers)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(`ml-demo-y-${i}`, demoId, 'youtube', h.month, h.year, h.ml * 0.8, h.fl * 0.5);
    });

    // 7. Add a Claim
    sqlite.db.prepare('DELETE FROM claims WHERE user_id = ?').run(demoId);
    sqlite.db.prepare(`
        INSERT INTO claims (id, user_id, type, email, artist_name, artist_link, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('claim-demo-1', demoId, 'spotify', demoEmail, 'Sunset Echoes', 'https://open.spotify.com/artist/demo', 'PENDING', new Date().toISOString());

    console.log('✅ Demo seeding complete.');
};

seedDemo();
process.exit(0);
