import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'wbbt.sqlite');

// Create database connection
// Create database connection
export let db: Database.Database;

export const closeDb = () => {
    if (db) {
        try { db.close(); } catch (e) { console.error('Error closing DB:', e); }
    }
};

export const initDb = () => {
    db = new Database(DB_PATH);
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
};

export const restartDb = () => {
    closeDb();
    initDb();
};

// Initial start
initDb();

// Initialize schema
const initSchema = () => {
    db.exec(`
    -- IP Bans table
    CREATE TABLE IF NOT EXISTS ip_bans (
      ip_address TEXT PRIMARY KEY,
      reason TEXT,
      banned_at TEXT DEFAULT (datetime('now'))
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      artist_name TEXT,
      role TEXT DEFAULT 'user',
      is_banned INTEGER DEFAULT 0,
      ban_reason TEXT,
      ban_ticket_id TEXT,
      last_ip TEXT,
      application_status TEXT DEFAULT 'NONE',
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Applications table
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bio TEXT,
      instagram_url TEXT,
      spotify_url TEXT,
      soundcloud_url TEXT,
      demo_track_url TEXT,
      status TEXT DEFAULT 'PENDING',
      submitted_at TEXT DEFAULT (datetime('now')),
      reviewed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Releases table
    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT,
      genre TEXT,
      sub_genre TEXT,
      status TEXT DEFAULT 'PENDING',
      cover_url TEXT,
      c_line TEXT,
      c_year TEXT,
      p_line TEXT,
      p_year TEXT,
      record_label TEXT,
      upc TEXT,
      wupc TEXT,
      release_date TEXT,
      release_timing TEXT,
      distributed_before INTEGER DEFAULT 0,
      territory TEXT DEFAULT 'Global',
      rejection_reason TEXT,
      takedown_requested_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      selected_stores TEXT,
      monetization TEXT,
      documents TEXT,
      confirmations TEXT,
      main_artist TEXT,
      original_release_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Tracks table
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      release_id TEXT NOT NULL,
      title TEXT NOT NULL,
      version TEXT,
      file_url TEXT,
      isrc TEXT,
      wisrc TEXT,
      language TEXT,
      is_explicit INTEGER DEFAULT 0,
      lyrics TEXT,
      ai_usage TEXT,
      composition_type TEXT,
      track_number INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
    );

    -- Track Artists table
    CREATE TABLE IF NOT EXISTS track_artists (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      legal_name TEXT,
      spotify_url TEXT,
      apple_id TEXT,
      artist_order INTEGER DEFAULT 0,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    -- Track Writers table
    CREATE TABLE IF NOT EXISTS track_writers (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      name TEXT NOT NULL,
      legal_name TEXT,
      role TEXT,
      share REAL DEFAULT 0,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    -- System Logs table
    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      level TEXT CHECK(level IN ('INFO', 'WARN', 'ERROR', 'SUCCESS')),
      message TEXT,
      details TEXT,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Artists Library table
    CREATE TABLE IF NOT EXISTS artists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      legal_name TEXT,
      spotify_url TEXT,
      apple_id TEXT,
      instagram_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      message TEXT,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

    -- Earnings table
    CREATE TABLE IF NOT EXISTS earnings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      month TEXT,
      amount REAL DEFAULT 0,
      streams INTEGER DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Withdrawals table
    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT,
      details TEXT,
      status TEXT DEFAULT 'PENDING',
      note TEXT,
      requested_at TEXT DEFAULT (datetime('now')),
      processed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Support Tickets table
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT,
      message TEXT,
      user_email TEXT,
      status TEXT DEFAULT 'OPEN',
      allow_uploads INTEGER DEFAULT 0,
      attachments TEXT DEFAULT '[]',
      is_closed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Ticket Responses table
    CREATE TABLE IF NOT EXISTS ticket_responses (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Files table
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      original_name TEXT,
      stored_name TEXT,
      type TEXT,
      size INTEGER,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Payment Methods table
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT DEFAULT 'IBAN',
      bank_name TEXT,
      account_holder TEXT,
      iban TEXT,
      swift_bic TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Teams table
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    -- Team Members table
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      share_percentage REAL DEFAULT 0,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'PENDING',
      joined_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Team Invites table
    CREATE TABLE IF NOT EXISTS team_invites (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      email TEXT NOT NULL,
      share_percentage REAL DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      invite_code TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    -- Contracts table
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      release_id TEXT,
      type TEXT DEFAULT 'distribution',
      terms TEXT,
      signed_at TEXT,
      ip_address TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (release_id) REFERENCES releases(id)
    );

    -- User Profile Extended
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      profile_picture TEXT,
      bio TEXT,
      instagram_url TEXT,
      spotify_url TEXT,
      soundcloud_url TEXT,
      youtube_url TEXT,
      twitter_url TEXT,
      website_url TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Artist Library
    CREATE TABLE IF NOT EXISTS artist_library (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Primary Artist',
        legal_name TEXT,
        spotify_url TEXT,
        apple_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Writer Library
    CREATE TABLE IF NOT EXISTS writer_library (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Songwriter',
        legal_name TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Claims table (Spotify/YouTube)
    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      email TEXT NOT NULL,
      artist_id TEXT,
      artist_name TEXT,
      artist_link TEXT,
      channel_url TEXT,
      status TEXT DEFAULT 'PENDING',
      rejection_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      reviewed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    `);

    // Migration for existing databases
    try { db.prepare("ALTER TABLE users ADD COLUMN ban_ticket_id TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE users ADD COLUMN last_ip TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE users ADD COLUMN spotify_url TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE users ADD COLUMN youtube_url TEXT").run(); } catch { }

    // Release Wizard Enhancements Migrations
    try { db.prepare("ALTER TABLE releases ADD COLUMN main_artist TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE releases ADD COLUMN original_release_date TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE tracks ADD COLUMN genre TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE tracks ADD COLUMN sub_genre TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE track_writers ADD COLUMN legal_name TEXT").run(); } catch { }

    // Missing columns migrations
    try { db.prepare("ALTER TABLE releases ADD COLUMN documents TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE releases ADD COLUMN selected_stores TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE releases ADD COLUMN monetization TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE releases ADD COLUMN upc TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE releases ADD COLUMN takedown_requested_at TEXT").run(); } catch { }

    // Instrumental & Copyright
    try { db.prepare("ALTER TABLE tracks ADD COLUMN is_instrumental INTEGER DEFAULT 0").run(); } catch { }
    try { db.prepare("ALTER TABLE tracks ADD COLUMN copyright_type TEXT").run(); } catch { }

    // System IDs (WUPC/WISRC)
    try { db.prepare("ALTER TABLE releases ADD COLUMN wupc TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE tracks ADD COLUMN wisrc TEXT").run(); } catch { }

    // Ticket Enhancements
    try { db.prepare("ALTER TABLE tickets ADD COLUMN user_email TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE tickets ADD COLUMN allow_uploads INTEGER DEFAULT 0").run(); } catch { }
    try { db.prepare("ALTER TABLE tickets ADD COLUMN attachments TEXT DEFAULT '[]'").run(); } catch { }
    try { db.prepare("ALTER TABLE tickets ADD COLUMN is_closed INTEGER DEFAULT 0").run(); } catch { }

    // Contract Enhancements
    try { db.prepare("ALTER TABLE contracts ADD COLUMN signed_document_url TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE contracts ADD COLUMN signer_name TEXT").run(); } catch { }
    try { db.prepare("ALTER TABLE contracts ADD COLUMN signature_hash TEXT").run(); } catch { }

    // Artist Social Accounts table for multi-artist analytics
    db.exec(`
    CREATE TABLE IF NOT EXISTS artist_social_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        artist_library_id TEXT,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        platform_id TEXT,
        name TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    `);

    // Monthly Listeners History table for tracking over time
    db.exec(`
    CREATE TABLE IF NOT EXISTS monthly_listeners_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        social_account_id TEXT,
        platform TEXT NOT NULL,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        monthly_listeners INTEGER DEFAULT 0,
        followers INTEGER DEFAULT 0,
        total_views INTEGER DEFAULT 0,
        subscribers INTEGER DEFAULT 0,
        recorded_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    `);

    // Daily API Cache - stores cached external analytics per user per day
    db.exec(`
    CREATE TABLE IF NOT EXISTS daily_api_cache (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        cache_date TEXT NOT NULL,
        spotify_data TEXT,
        youtube_data TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    `);
};

import bcrypt from 'bcryptjs'; // Imported for seeding admin

// ... (rest of imports)

// Initialize schema
const initSchema = () => {
    // ... (existing schema tables)
    // ...
};

// Seed Admin Account
const seedAdmin = () => {
    const admin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
    if (!admin) {
        console.log('🌱 Seeding Admin Account...');
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        const adminUser = {
            id: 'admin-1',
            email: 'admin@wbbt.net',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            artistName: 'WBBT Admin',
            role: 'admin',
            applicationStatus: 'APPROVED',
            balance: 0
        };

        try {
            const stmt = db.prepare(`
                INSERT INTO users(id, email, password, first_name, last_name, artist_name, role, application_status, balance)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(adminUser.id, adminUser.email, adminUser.password, adminUser.firstName, adminUser.lastName, adminUser.artistName, adminUser.role, adminUser.applicationStatus, adminUser.balance);
            console.log('✅ Admin Account Created: admin@wbbt.net / admin123');
        } catch (error) {
            console.error('❌ Failed to seed admin:', error);
        }
    }
};

// Execute Init and Seed
initSchema();
seedAdmin();


// Migration: Add confirmations column if not exists
try {
    db.prepare("ALTER TABLE releases ADD COLUMN confirmations TEXT").run();
    console.log("Migration: Added confirmations column to releases table");
} catch (e: any) {
    // Ignore duplicate column error, log others
    if (!e.message.includes('duplicate column name')) {
        console.error("Migration error (confirmations):", e.message);
    }
}

export const sqlite = {
    db,

    // IP Ban Helpers
    banIp: (ip: string, reason: string) => {
        try {
            db.prepare('INSERT OR REPLACE INTO ip_bans (ip_address, reason) VALUES (?, ?)').run(ip, reason);
        } catch (e) { console.error('Failed to ban IP', e); }
    },

    isIpBanned: (ip: string) => {
        return db.prepare('SELECT * FROM ip_bans WHERE ip_address = ?').get(ip);
    },

    updateUserIp: (userId: string, ip: string) => {
        db.prepare('UPDATE users SET last_ip = ? WHERE id = ?').run(ip, userId);
    },

    setBanTicket: (userId: string, ticketId: string) => {
        db.prepare('UPDATE users SET ban_ticket_id = ? WHERE id = ?').run(ticketId, userId);
    },

    // Generic query helpers
    get: <T>(sql: string, params: any[] = []): T | undefined => {
        return db.prepare(sql).get(...params) as T | undefined;
    },

    all: <T>(sql: string, params: any[] = []): T[] => {
        return db.prepare(sql).all(...params) as T[];
    },

    run: (sql: string, params: any[] = []) => {
        return db.prepare(sql).run(...params);
    },

    // User operations
    getUserById: (id: string) => {
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    },

    getUserByEmail: (email: string) => {
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    },

    createUser: (user: any) => {
        const stmt = db.prepare(`
      INSERT INTO users(id, email, password, first_name, last_name, artist_name, role, application_status, balance)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(user.id, user.email, user.password, user.firstName, user.lastName, user.artistName, user.role || 'user', user.applicationStatus || 'NONE', user.balance || 0);
    },

    updateUser: (id: string, updates: any) => {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        return db.prepare(`UPDATE users SET ${fields} WHERE id = ? `).run(...values, id);
    },

    // Release operations
    getReleaseById: (id: string) => {
        return db.prepare('SELECT * FROM releases WHERE id = ?').get(id);
    },

    getReleasesByUser: (userId: string) => {
        return db.prepare('SELECT * FROM releases WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    getAllReleases: () => {
        return db.prepare('SELECT * FROM releases ORDER BY created_at DESC').all();
    },

    createRelease: (release: any) => {
        const stmt = db.prepare(`
        INSERT INTO releases (
            id, user_id, title, type, genre, sub_genre, status, cover_url,
            c_line, c_year, p_line, p_year, record_label, upc, wupc,
            release_date, release_timing, distributed_before, territory,
            selected_stores, monetization, documents, main_artist, original_release_date,
            confirmations
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?
        )
    `);

        const transaction = db.transaction(() => {
            stmt.run(
                release.id, release.userId, release.title, release.type, release.genre, release.subGenre, release.status, release.coverUrl,
                release.cLine, release.cYear, release.pLine, release.pYear, release.recordLabel, release.upc,
                release.wupc, // NEW: WUPC
                release.releaseDate, release.releaseTiming, release.distributedBefore ? 1 : 0, release.territory,
                JSON.stringify(release.selectedStores), JSON.stringify(release.monetization), JSON.stringify(release.documents), release.mainArtist, release.originalReleaseDate,
                JSON.stringify(release.confirmations) // New field
            );

            const insertTrack = db.prepare(`
            INSERT INTO tracks (
                id, release_id, title, version, file_url, isrc,
                language, is_explicit, lyrics, ai_usage, composition_type, track_number, genre, sub_genre,
                is_instrumental, copyright_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

            // Insert Track Artists
            const insertArtist = db.prepare(`
            INSERT INTO track_artists (id, track_id, name, role, legal_name, spotify_url, apple_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

            // Insert Track Writers
            const insertWriter = db.prepare(`
            INSERT INTO track_writers (id, track_id, name, legal_name, role, share)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

            (release.tracks || []).forEach((track: any, index: number) => {
                insertTrack.run(
                    track.id, release.id, track.title, track.version, track.fileUrl, track.isrc,
                    track.language, track.isExplicit ? 1 : 0, track.lyrics, track.aiUsage, track.compositionType, index + 1,
                    track.genre, track.subGenre,
                    track.isInstrumental ? 1 : 0, track.copyrightType
                );

                (track.artists || []).forEach((artist: any) => {
                    insertArtist.run(artist.id, track.id, artist.name, artist.role, artist.legalName, artist.spotifyUrl, artist.appleId);
                });

                if (track.writers) {
                    (track.writers || []).forEach((writer: any) => {
                        insertWriter.run(writer.id || `wr-${Date.now()}-${Math.random()}`, track.id, writer.name, writer.legalName, writer.role, writer.share);
                    });
                }
            });
        });

        transaction();
        return release;
    },
    updateRelease: (id: string, updates: any) => {
        const mappings: { [key: string]: string } = {
            userId: 'user_id', subGenre: 'sub_genre', coverUrl: 'cover_url',
            cLine: 'c_line', cYear: 'c_year', pLine: 'p_line', pYear: 'p_year',
            recordLabel: 'record_label', releaseDate: 'release_date', releaseTiming: 'release_timing',
            distributedBefore: 'distributed_before', selectedStores: 'selected_stores',
            rejectionReason: 'rejection_reason', takedownRequestedAt: 'takedown_requested_at',
            documents: 'documents', mainArtist: 'main_artist', originalReleaseDate: 'original_release_date'
        };

        const sqlUpdates: string[] = [];
        const values: any[] = [];

        Object.entries(updates).forEach(([key, value]) => {
            const sqlKey = mappings[key] || key;
            sqlUpdates.push(`${sqlKey} = ?`);
            if (key === 'selectedStores' || key === 'monetization' || key === 'documents') {
                values.push(JSON.stringify(value));
            } else if (typeof value === 'boolean') {
                values.push(value ? 1 : 0);
            } else {
                values.push(value);
            }
        });

        if (sqlUpdates.length > 0) {
            return db.prepare(`UPDATE releases SET ${sqlUpdates.join(', ')} WHERE id = ? `).run(...values, id);
        }
    },

    // Takedown operations
    requestTakedown: (id: string) => {
        const stmt = db.prepare("UPDATE releases SET takedown_requested_at = datetime('now'), status = 'TAKEDOWN_REQUESTED' WHERE id = ?");
        return stmt.run(id);
    },

    approveTakedown: (id: string) => {
        // Just update status, notification is handled in index-sqlite.ts
        const stmt = db.prepare("UPDATE releases SET status = 'TAKEDOWN_APPROVED' WHERE id = ?");
        return stmt.run(id);
    },

    // Track operations
    getTracksByRelease: (releaseId: string) => {
        return db.prepare('SELECT * FROM tracks WHERE release_id = ? ORDER BY track_number').all(releaseId);
    },

    createTrack: (track: any) => {
        const stmt = db.prepare(`
      INSERT INTO tracks(id, release_id, title, version, file_url, isrc, wisrc, language, is_explicit, lyrics, ai_usage, composition_type, track_number, genre, sub_genre, is_instrumental, copyright_type)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(
            track.id, track.releaseId, track.title, track.version, track.fileUrl,
            track.isrc, track.wisrc, // NEW: WISRC
            track.language, track.isExplicit ? 1 : 0, track.lyrics,
            track.aiUsage, track.compositionType, track.trackNumber || 0,
            track.genre, track.subGenre,
            track.isInstrumental ? 1 : 0, track.copyrightType
        );
    },

    deleteTracksByRelease: (releaseId: string) => {
        return db.prepare('DELETE FROM tracks WHERE release_id = ?').run(releaseId);
    },

    updateTrack: (id: string, updates: any) => {
        const allowedColumns = ['title', 'version', 'isrc', 'iswc', 'is_explicit', 'language', 'lyrics', 'genre', 'sub_genre', 'composition_type', 'is_instrumental', 'copyright_type', 'ai_usage'];
        const sets: string[] = [];
        const values: any[] = [];

        for (const col of allowedColumns) {
            // Check camelCase to snake_case mapping if needed, or just assume updates matches db columns?
            // The updates object likely comes from frontend with camelCase.
            // Let's map key common ones:
            let val = undefined;
            if (col === 'title') val = updates.title;
            if (col === 'version') val = updates.version;
            if (col === 'isrc') val = updates.isrc;
            if (col === 'iswc') val = updates.iswc;
            if (col === 'is_explicit') val = updates.isExplicit !== undefined ? (updates.isExplicit ? 1 : 0) : undefined;
            if (col === 'language') val = updates.language;
            if (col === 'lyrics') val = updates.lyrics;
            if (col === 'genre') val = updates.genre;
            if (col === 'sub_genre') val = updates.subGenre;
            if (col === 'composition_type') val = updates.compositionType;
            if (col === 'is_instrumental') val = updates.isInstrumental !== undefined ? (updates.isInstrumental ? 1 : 0) : undefined;
            if (col === 'copyright_type') val = updates.copyrightType;
            if (col === 'ai_usage') val = updates.aiUsage;

            if (val !== undefined) {
                sets.push(`${col} = ?`);
                values.push(val);
            }
        }

        if (sets.length === 0) return;

        values.push(id);
        const query = `UPDATE tracks SET ${sets.join(', ')} WHERE id = ?`;
        return db.prepare(query).run(...values);
    },

    // Track Artists
    getArtistsByTrack: (trackId: string) => {
        return db.prepare('SELECT * FROM track_artists WHERE track_id = ? ORDER BY artist_order').all(trackId);
    },

    createTrackArtist: (artist: any) => {
        const stmt = db.prepare(`
      INSERT INTO track_artists(id, track_id, name, role, legal_name, spotify_url, apple_id, artist_order)
VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(artist.id, artist.trackId, artist.name, artist.role, artist.legalName, artist.spotifyUrl, artist.appleId, artist.order || 0);
    },

    // Track Writers
    getWritersByTrack: (trackId: string) => {
        return db.prepare('SELECT * FROM track_writers WHERE track_id = ? ORDER BY name').all(trackId);
    },

    createTrackWriter: (writer: any) => {
        const stmt = db.prepare(`
      INSERT INTO track_writers(id, track_id, name, legal_name, role, share)
VALUES(?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(writer.id, writer.trackId, writer.name, writer.legalName, writer.role, writer.share || 0);
    },

    updateTrackArtists: (trackId: string, artists: any[]) => {
        // Transactional replacement would be ideal, but for now strict delete-insert
        const deleteStmt = db.prepare('DELETE FROM track_artists WHERE track_id = ?');

        const insertStmt = db.prepare(`
            INSERT INTO track_artists(id, track_id, name, role, legal_name, spotify_url, apple_id, artist_order)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((artistsToInsert) => {
            deleteStmt.run(trackId);
            for (let i = 0; i < artistsToInsert.length; i++) {
                const a = artistsToInsert[i];
                // Reuse ID if present? Or just generate new. 
                // Let's generate new to avoid complexities, or use provided if stable.
                // Actually if we delete, we should probably generate new IDs unless we want to keep them stable.
                // Keeping it simple: generate new IDs for the linkage.
                const newId = `ta-${trackId}-${i}-${Date.now()}`;
                insertStmt.run(newId, trackId, a.name, a.role, a.legalName, a.spotifyUrl, a.appleId, i);
            }
        });

        transaction(artists);
    },

    // Notifications
    getNotificationsByUser: (userId: string) => {
        return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    createNotification: (notif: any) => {
        const stmt = db.prepare(`
      INSERT INTO notifications(id, user_id, title, message, type)
VALUES(?, ?, ?, ?, ?)
    `);
        return stmt.run(notif.id, notif.userId, notif.title, notif.message, notif.type || 'info');
    },

    markNotificationsRead: (userId: string) => {
        return db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
    },

    // Artists Library
    getArtistLibrary: (userId: string) => {
        return db.prepare('SELECT * FROM artists WHERE user_id = ?').all(userId);
    },

    createArtist: (artist: any) => {
        const stmt = db.prepare(`
      INSERT INTO artists(id, user_id, name, legal_name, spotify_url, apple_id, instagram_url)
VALUES(?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(artist.id, artist.userId, artist.name, artist.legalName, artist.spotifyUrl, artist.appleId, artist.instagramUrl);
    },

    // Withdrawals
    getWithdrawalsByUser: (userId: string) => {
        return db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC').all(userId);
    },

    getAllWithdrawals: () => {
        return db.prepare(`
            SELECT w.*, u.email, u.artist_name as artistName 
            FROM withdrawals w 
            JOIN users u ON w.user_id = u.id 
            ORDER BY w.requested_at DESC
    `).all();
    },

    createWithdrawal: (withdrawal: any) => {
        const transaction = db.transaction(() => {
            // Check sufficient funds
            const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(withdrawal.userId) as any;
            if (!user || user.balance < withdrawal.amount) {
                throw new Error('Insufficient balance');
            }

            const stmt = db.prepare(`
                INSERT INTO withdrawals(id, user_id, amount, method, details, status, requested_at)
VALUES(?, ?, ?, ?, ?, ?, datetime('now'))
            `);
            stmt.run(withdrawal.id, withdrawal.userId, withdrawal.amount, withdrawal.method, withdrawal.details, withdrawal.status || 'PENDING');

            // Deduct balance immediately
            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(withdrawal.amount, withdrawal.userId);
        });
        return transaction();
    },

    updateWithdrawal: (id: string, updates: any) => {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        return db.prepare(`UPDATE withdrawals SET ${fields} WHERE id = ? `).run(...values, id);
    },

    updateWithdrawalStatus: (id: string, status: string, note?: string) => {
        const transaction = db.transaction(() => {
            const current = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id) as any;
            if (!current) throw new Error('Withdrawal not found');

            // Update status
            db.prepare('UPDATE withdrawals SET status = ?, note = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(status, note, id);

            // Refund if rejected and previously pending (money was deducted)
            if (status === 'REJECTED' && current.status !== 'REJECTED') {
                db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(current.amount, current.user_id);
            }
        });
        return transaction();
    },

    // Earnings
    getEarningsByUser: (userId: string) => {
        return db.prepare('SELECT * FROM earnings WHERE user_id = ? ORDER BY month DESC').all(userId);
    },

    getAllEarnings: () => {
        return db.prepare('SELECT * FROM earnings ORDER BY month DESC').all();
    },

    createEarning: (earning: any) => {
        const transaction = db.transaction(() => {
            const stmt = db.prepare(`
                INSERT INTO earnings(id, user_id, month, amount, streams, downloads)
VALUES(?, ?, ?, ?, ?, ?)
    `);
            stmt.run(earning.id, earning.userId, earning.month, earning.amount, earning.streams, earning.downloads);

            // Add to user balance
            db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(earning.amount, earning.userId);
        });
        return transaction();
    },

    deleteEarning: (id: string) => {
        const transaction = db.transaction(() => {
            const earning = db.prepare('SELECT * FROM earnings WHERE id = ?').get(id) as any;
            if (earning) {
                db.prepare('DELETE FROM earnings WHERE id = ?').run(id);
                // Deduct from user balance
                db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(earning.amount, earning.user_id);
            }
        });
        return transaction();
    },

    // Applications
    getApplicationByUser: (userId: string) => {
        return db.prepare('SELECT * FROM applications WHERE user_id = ?').get(userId);
    },

    getPendingApplications: () => {
        return db.prepare(`
      SELECT a.*, u.email, u.first_name, u.last_name, u.artist_name
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.status = 'PENDING'
      ORDER BY a.submitted_at DESC
    `).all();
    },

    createApplication: (app: any) => {
        const stmt = db.prepare(`
      INSERT INTO applications(id, user_id, bio, instagram_url, spotify_url, soundcloud_url, demo_track_url, status)
VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(app.id, app.userId, app.bio, app.instagramUrl, app.spotifyUrl, app.soundcloudUrl, app.demoTrackUrl, app.status || 'PENDING');
    },

    updateApplication: (id: string, updates: any) => {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        return db.prepare(`UPDATE applications SET ${fields} WHERE id = ? `).run(...values, id);
    },

    // Support Tickets
    getTicketsByUser: (userId: string) => {
        return db.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    getAllTickets: () => {
        return db.prepare(`
      SELECT t.*, u.email, COALESCE(NULLIF(u.artist_name, ''), u.first_name || ' ' || u.last_name, u.email) as userName
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `).all();
    },

    createTicket: (ticket: any) => {
        const stmt = db.prepare(`
      INSERT INTO tickets(id, user_id, subject, message, status, user_email, allow_uploads, attachments, is_closed)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(ticket.id, ticket.userId, ticket.subject, ticket.message, ticket.status || 'OPEN', ticket.userEmail, ticket.allowUploads ? 1 : 0, JSON.stringify(ticket.attachments || []), ticket.isClosed ? 1 : 0);
    },

    getTicketResponses: (ticketId: string) => {
        return db.prepare('SELECT * FROM ticket_responses WHERE ticket_id = ? ORDER BY created_at').all(ticketId);
    },

    createTicketResponse: (response: any) => {
        const stmt = db.prepare(`
      INSERT INTO ticket_responses(id, ticket_id, user_id, message, is_admin)
VALUES(?, ?, ?, ?, ?)
    `);
        return stmt.run(response.id, response.ticketId, response.userId, response.message, response.isAdmin ? 1 : 0);
    },

    closeTicket: (id: string, email?: string) => {
        return db.prepare("UPDATE tickets SET status = 'CLOSED', is_closed = 1 WHERE id = ?").run(id);
    },

    // Files
    getFileById: (id: string) => {
        return db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    },

    createFile: (file: any) => {
        const stmt = db.prepare(`
      INSERT INTO files(id, user_id, original_name, stored_name, type, size)
VALUES(?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(file.id, file.userId, file.originalName, file.storedName, file.type, file.size);
    },

    // Stats
    getStats: () => {
        const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
        const releases = db.prepare('SELECT COUNT(*) as count FROM releases').get() as { count: number };
        const pending = db.prepare("SELECT COUNT(*) as count FROM releases WHERE status = 'PENDING'").get() as { count: number };
        const approved = db.prepare("SELECT COUNT(*) as count FROM releases WHERE status = 'APPROVED'").get() as { count: number };

        // Aggregate Analytics (Listeners & Subscribers) from latest cache of each user
        const latestCache = db.prepare(`
            SELECT spotify_data, youtube_data 
            FROM daily_api_cache 
            GROUP BY user_id 
            HAVING MAX(created_at)
        `).all() as any[];

        let totalListeners = 0;
        let totalSubscribers = 0;
        let totalSpotifyFollowers = 0;

        latestCache.forEach(c => {
            try {
                if (c.spotify_data) {
                    const s = JSON.parse(c.spotify_data);
                    totalListeners += (Number(s.monthlyListeners) || 0);
                    totalSpotifyFollowers += (Number(s.followers) || 0);
                }
                if (c.youtube_data) {
                    const y = JSON.parse(c.youtube_data);
                    totalSubscribers += (Number(y.subscribers) || 0);
                }
            } catch (e) { }
        });

        // Total Lifetime Earnings
        const earnings = db.prepare('SELECT SUM(amount) as total FROM earnings').get() as { total: number };
        const totalLifetimeEarnings = earnings.total || 0;

        // Growth History (Global)
        // Note: Month sorting might need '01' padding or separate year/month sort if month is text ('Jan').
        // The table uses full month name or short? 'month' column. 
        // Safer to just limit and let frontend handle visual sort or trust insertion order if mostly sequential.
        // Assuming year/month columns are enough.
        const history = db.prepare(`
            SELECT year, month, SUM(monthly_listeners) as total_listeners, SUM(subscribers) as total_subscribers 
            FROM monthly_listeners_history 
            GROUP BY year, month 
            ORDER BY year DESC, month DESC
            LIMIT 12
        `).all();

        return {
            totalUsers: users.count,
            totalReleases: releases.count,
            pendingReleases: pending.count,
            approvedReleases: approved.count,
            totalListeners,
            totalSubscribers,
            totalSpotifyFollowers,
            totalLifetimeEarnings,
            history: history.reverse()
        };
    },

    // Payment Methods
    getPaymentMethods: (userId: string) => {
        return db.prepare('SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(userId);
    },

    getDefaultPaymentMethod: (userId: string) => {
        return db.prepare('SELECT * FROM payment_methods WHERE user_id = ? AND is_default = 1').get(userId);
    },

    createPaymentMethod: (pm: any) => {
        // If setting as default, unset other defaults first
        if (pm.isDefault) {
            db.prepare('UPDATE payment_methods SET is_default = 0 WHERE user_id = ?').run(pm.userId);
        }
        const stmt = db.prepare(`
            INSERT INTO payment_methods(id, user_id, type, bank_name, account_holder, iban, swift_bic, is_default)
VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(pm.id, pm.userId, pm.type || 'IBAN', pm.bankName, pm.accountHolder, pm.iban, pm.swiftBic, pm.isDefault ? 1 : 0);
    },

    updatePaymentMethod: (id: string, updates: any) => {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        return db.prepare(`UPDATE payment_methods SET ${fields} WHERE id = ? `).run(...values, id);
    },

    deletePaymentMethod: (id: string) => {
        return db.prepare('DELETE FROM payment_methods WHERE id = ?').run(id);
    },

    setDefaultPaymentMethod: (userId: string, methodId: string) => {
        db.prepare('UPDATE payment_methods SET is_default = 0 WHERE user_id = ?').run(userId);
        return db.prepare('UPDATE payment_methods SET is_default = 1 WHERE id = ?').run(methodId);
    },

    // Teams
    getTeamsByOwner: (ownerId: string) => {
        return db.prepare('SELECT * FROM teams WHERE owner_id = ? ORDER BY created_at DESC').all(ownerId);
    },

    getTeamById: (id: string) => {
        return db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    },

    createTeam: (team: any) => {
        const stmt = db.prepare('INSERT INTO teams (id, owner_id, name) VALUES (?, ?, ?)');
        return stmt.run(team.id, team.ownerId, team.name);
    },

    deleteTeam: (id: string) => {
        db.prepare('DELETE FROM team_members WHERE team_id = ?').run(id);
        db.prepare('DELETE FROM team_invites WHERE team_id = ?').run(id);
        return db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    },

    // Team Members
    getTeamMembers: (teamId: string) => {
        return db.prepare(`
            SELECT tm.*, u.email, u.first_name, u.last_name, u.artist_name
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = ?
    ORDER BY tm.share_percentage DESC
        `).all(teamId);
    },

    getUserTeams: (userId: string) => {
        return db.prepare(`
            SELECT t.*, tm.share_percentage, tm.role, tm.status
            FROM team_members tm
            JOIN teams t ON tm.team_id = t.id
            WHERE tm.user_id = ? AND tm.status = 'ACTIVE'
    `).all(userId);
    },

    addTeamMember: (member: any) => {
        const stmt = db.prepare(`
            INSERT INTO team_members(id, team_id, user_id, share_percentage, role, status, joined_at)
VALUES(?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(member.id, member.teamId, member.userId, member.sharePercentage || 0, member.role || 'member', member.status || 'ACTIVE', new Date().toISOString());
    },

    updateTeamMember: (id: string, updates: any) => {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        return db.prepare(`UPDATE team_members SET ${fields} WHERE id = ? `).run(...values, id);
    },

    removeTeamMember: (teamId: string, userId: string) => {
        return db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId);
    },

    // Team Invites
    getTeamInvites: (teamId: string) => {
        return db.prepare('SELECT * FROM team_invites WHERE team_id = ? ORDER BY created_at DESC').all(teamId);
    },

    getPendingInvitesByEmail: (email: string) => {
        return db.prepare(`
            SELECT ti.*, t.name as team_name, u.artist_name as owner_name
            FROM team_invites ti
            JOIN teams t ON ti.team_id = t.id
            JOIN users u ON t.owner_id = u.id
            WHERE ti.email = ? AND ti.status = 'PENDING'
    `).all(email);
    },

    getInviteByCode: (code: string) => {
        return db.prepare('SELECT * FROM team_invites WHERE invite_code = ?').get(code);
    },

    createTeamInvite: (invite: any) => {
        const stmt = db.prepare(`
            INSERT INTO team_invites(id, team_id, email, share_percentage, invite_code, expires_at)
VALUES(?, ?, ?, ?, ?, ?)
    `);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
        return stmt.run(invite.id, invite.teamId, invite.email, invite.sharePercentage || 0, invite.inviteCode, expiresAt.toISOString());
    },

    updateTeamInvite: (id: string, status: string) => {
        return db.prepare('UPDATE team_invites SET status = ? WHERE id = ?').run(status, id);
    },

    // Contracts
    getContractsByUser: (userId: string) => {
        return db.prepare('SELECT * FROM contracts WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    getContractByRelease: (releaseId: string) => {
        return db.prepare('SELECT * FROM contracts WHERE release_id = ?').get(releaseId);
    },

    createContract: (contract: any) => {
        const stmt = db.prepare(`
            INSERT INTO contracts(id, user_id, release_id, type, terms, status)
VALUES(?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(contract.id, contract.userId, contract.releaseId, contract.type || 'distribution', contract.terms, contract.status || 'PENDING');
    },

    signContract: (id: string, ipAddress: string) => {
        return db.prepare('UPDATE contracts SET status = ?, signed_at = ?, ip_address = ? WHERE id = ?')
            .run('SIGNED', new Date().toISOString(), ipAddress, id);
    },

    // User Profiles
    getUserProfile: (userId: string) => {
        return db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    },

    upsertUserProfile: (profile: any) => {
        const existing = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(profile.userId);
        if (existing) {
            const stmt = db.prepare(`
                UPDATE user_profiles SET
profile_picture = COALESCE(?, profile_picture),
    bio = COALESCE(?, bio),
    instagram_url = ?,
    spotify_url = ?,
    soundcloud_url = ?,
    youtube_url = ?,
    twitter_url = ?,
    website_url = ?,
    updated_at = datetime('now')
                WHERE user_id = ?
    `);
            return stmt.run(
                profile.profilePicture, profile.bio, profile.instagramUrl, profile.spotifyUrl,
                profile.soundcloudUrl, profile.youtubeUrl, profile.twitterUrl, profile.websiteUrl,
                profile.userId
            );
        } else {
            const stmt = db.prepare(`
                INSERT INTO user_profiles(user_id, profile_picture, bio, instagram_url, spotify_url, soundcloud_url, youtube_url, twitter_url, website_url)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
            return stmt.run(
                profile.userId, profile.profilePicture, profile.bio, profile.instagramUrl, profile.spotifyUrl,
                profile.soundcloudUrl, profile.youtubeUrl, profile.twitterUrl, profile.websiteUrl
            );
        }
    },

    // Artist Library operations
    getArtistsByUser: (userId: string) => {
        return db.prepare('SELECT * FROM artist_library WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    createArtistLibrary: (artist: any) => {
        const stmt = db.prepare(`
            INSERT INTO artist_library(id, user_id, name, role, legal_name, spotify_url, apple_id)
VALUES(?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(artist.id, artist.userId, artist.name, artist.role, artist.legalName, artist.spotifyUrl, artist.appleId);
    },

    // Writer Library operations
    getWritersByUser: (userId: string) => {
        return db.prepare('SELECT * FROM writer_library WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    createWriterLibrary: (writer: any) => {
        const stmt = db.prepare(`
            INSERT INTO writer_library(id, user_id, name, role, legal_name)
VALUES(?, ?, ?, ?, ?)
    `);
        return stmt.run(writer.id, writer.userId, writer.name, writer.role, writer.legalName);
    },

    getPaymentMethodsByUser: (userId: string) => {
        return db.prepare('SELECT * FROM payment_methods WHERE user_id = ?').all(userId);
    },

    deleteUser: (userId: string) => {
        const deleteTransaction = db.transaction(() => {
            // 1. Delete Team Data
            const teamsOwned = db.prepare('SELECT id FROM teams WHERE owner_id = ?').all(userId) as any[];
            for (const team of teamsOwned) {
                db.prepare('DELETE FROM team_members WHERE team_id = ?').run(team.id);
                db.prepare('DELETE FROM team_invites WHERE team_id = ?').run(team.id);
                db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);
            }
            db.prepare('DELETE FROM team_members WHERE user_id = ?').run(userId);

            // 2. Delete Releases & Tracks
            const releases = db.prepare('SELECT id FROM releases WHERE user_id = ?').all(userId) as any[];
            for (const rel of releases) {
                const tracks = db.prepare('SELECT id FROM tracks WHERE release_id = ?').all(rel.id) as any[];
                for (const t of tracks) {
                    db.prepare('DELETE FROM track_artists WHERE track_id = ?').run(t.id);
                    db.prepare('DELETE FROM track_writers WHERE track_id = ?').run(t.id);
                }
                db.prepare('DELETE FROM tracks WHERE release_id = ?').run(rel.id);
                db.prepare('DELETE FROM contracts WHERE release_id = ?').run(rel.id);
            }
            db.prepare('DELETE FROM releases WHERE user_id = ?').run(userId);

            // 3. Delete Library
            db.prepare('DELETE FROM artist_library WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM writer_library WHERE user_id = ?').run(userId);

            // 4. Delete Financials
            db.prepare('DELETE FROM earnings WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM withdrawals WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM payment_methods WHERE user_id = ?').run(userId);

            // 5. Delete Support & Social
            db.prepare('DELETE FROM ticket_responses WHERE user_id = ?').run(userId);
            const tickets = db.prepare('SELECT id FROM tickets WHERE user_id = ?').all(userId) as any[];
            for (const t of tickets) {
                db.prepare('DELETE FROM ticket_responses WHERE ticket_id = ?').run(t.id);
            }
            db.prepare('DELETE FROM tickets WHERE user_id = ?').run(userId);

            db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM applications WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(userId);

            // 6. Delete User
            db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        });

        deleteTransaction();
    },





    // Notifications


    getUserNotifications: (userId: string) => {
        return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    markNotificationRead: (id: string) => {
        return db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    },

    // Claims
    createClaim: (claim: any) => {
        const stmt = db.prepare(`
            INSERT INTO claims(id, user_id, type, email, artist_id, artist_name, artist_link, channel_url, status)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(claim.id, claim.userId, claim.type, claim.email, claim.artistId, claim.artistName, claim.artistLink, claim.channelUrl, claim.status || 'PENDING');
    },

    getClaimsByUser: (userId: string) => {
        return db.prepare('SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    getAllClaims: () => {
        return db.prepare(`
            SELECT c.*, u.artist_name, u.email as user_email
            FROM claims c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        `).all();
    },

    optimize: () => {
        db.exec('VACUUM');
        db.exec('ANALYZE');
        return { success: true };
    },

    updateClaimStatus: (id: string, status: string, rejectionReason?: string) => {
        if (rejectionReason) {
            db.prepare("UPDATE claims SET status = ?, rejection_reason = ?, reviewed_at = datetime('now') WHERE id = ?").run(status, rejectionReason, id);
        } else {
            db.prepare("UPDATE claims SET status = ?, reviewed_at = datetime('now') WHERE id = ?").run(status, id);
        }
    },

    // Artist Social Accounts
    createSocialAccount: (account: { id: string; userId: string; artistLibraryId?: string; platform: string; url: string; platformId?: string; name?: string }) => {
        const stmt = db.prepare(`
            INSERT INTO artist_social_accounts(id, user_id, artist_library_id, platform, url, platform_id, name)
            VALUES(?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(account.id, account.userId, account.artistLibraryId || null, account.platform, account.url, account.platformId || null, account.name || null);
    },

    getSocialAccountsByUser: (userId: string) => {
        return db.prepare('SELECT * FROM artist_social_accounts WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC').all(userId);
    },

    getSocialAccountById: (id: string) => {
        return db.prepare('SELECT * FROM artist_social_accounts WHERE id = ?').get(id);
    },

    updateSocialAccount: (id: string, updates: { url?: string; platformId?: string; name?: string; isActive?: number }) => {
        const fields: string[] = [];
        const values: any[] = [];
        if (updates.url !== undefined) { fields.push('url = ?'); values.push(updates.url); }
        if (updates.platformId !== undefined) { fields.push('platform_id = ?'); values.push(updates.platformId); }
        if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
        if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive); }
        if (fields.length === 0) return;
        values.push(id);
        db.prepare(`UPDATE artist_social_accounts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    },

    deleteSocialAccount: (id: string) => {
        return db.prepare('DELETE FROM artist_social_accounts WHERE id = ?').run(id);
    },

    getSocialAccountsByPlatform: (userId: string, platform: string) => {
        return db.prepare('SELECT * FROM artist_social_accounts WHERE user_id = ? AND platform = ? AND is_active = 1').all(userId, platform);
    },

    // Monthly Listeners History
    recordMonthlyListeners: (record: {
        id: string;
        userId: string;
        socialAccountId?: string;
        platform: string;
        month: string;
        year: number;
        monthlyListeners?: number;
        followers?: number;
        totalViews?: number;
        subscribers?: number;
    }) => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO monthly_listeners_history(id, user_id, social_account_id, platform, month, year, monthly_listeners, followers, total_views, subscribers)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            record.id,
            record.userId,
            record.socialAccountId || null,
            record.platform,
            record.month,
            record.year,
            record.monthlyListeners || 0,
            record.followers || 0,
            record.totalViews || 0,
            record.subscribers || 0
        );
    },

    getMonthlyListenersHistory: (userId: string, limit: number = 12) => {
        return db.prepare(`
            SELECT * FROM monthly_listeners_history 
            WHERE user_id = ? 
            ORDER BY year DESC, month DESC 
            LIMIT ?
        `).all(userId, limit);
    },

    getMonthlyListenersHistoryByPlatform: (userId: string, platform: string, limit: number = 12) => {
        return db.prepare(`
            SELECT * FROM monthly_listeners_history 
            WHERE user_id = ? AND platform = ?
            ORDER BY year DESC, month DESC 
            LIMIT ?
        `).all(userId, platform, limit);
    },

    // Daily API Cache
    getDailyCache: (userId: string, date: string) => {
        return db.prepare('SELECT * FROM daily_api_cache WHERE user_id = ? AND cache_date = ?').get(userId, date);
    },

    // Get the most recent cache for a user (any date)
    getLatestCache: (userId: string) => {
        return db.prepare('SELECT * FROM daily_api_cache WHERE user_id = ? ORDER BY cache_date DESC LIMIT 1').get(userId);
    },

    setDailyCache: (userId: string, date: string, spotifyData: any, youtubeData: any) => {
        const id = `cache-${userId}-${date}`;
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO daily_api_cache(id, user_id, cache_date, spotify_data, youtube_data)
            VALUES(?, ?, ?, ?, ?)
        `);
        return stmt.run(id, userId, date, JSON.stringify(spotifyData), JSON.stringify(youtubeData));
    },

    clearOldCache: () => {
        // Clean up cache older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateStr = sevenDaysAgo.toISOString().split('T')[0];
        return db.prepare('DELETE FROM daily_api_cache WHERE cache_date < ?').run(dateStr);
    },

    // System Logs
    createLog: (log: { level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', message: string, details?: string, userId?: string }) => {
        const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return db.prepare('INSERT INTO system_logs (id, level, message, details, user_id) VALUES (?, ?, ?, ?, ?)').run(
            id, log.level, log.message, log.details || null, log.userId || null
        );
    },

    getLogs: (limit: number = 100) => {
        return db.prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT ?').all(limit);
    },

    deleteOldLogs: (days: number) => {
        return db.prepare("DELETE FROM system_logs WHERE created_at < datetime('now', '-' || ? || ' days')").run(days);
    }
};

export default sqlite;
