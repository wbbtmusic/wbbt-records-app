// Migration script: JSON -> SQLite
// Run this once to migrate existing data

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sqlite } from './database.js';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_DB_PATH = path.join(__dirname, 'database.json');

const migrate = () => {
    console.log('🚀 Starting migration from JSON to SQLite...\n');

    // Load JSON database
    if (!fs.existsSync(JSON_DB_PATH)) {
        console.log('❌ No JSON database found. Nothing to migrate.');
        return;
    }

    const jsonData = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
    console.log('📂 Loaded JSON database');
    console.log(`   Users: ${jsonData.users?.length || 0}`);
    console.log(`   Releases: ${jsonData.releases?.length || 0}`);
    console.log(`   Applications: ${jsonData.applications?.length || 0}`);
    console.log(`   Notifications: ${jsonData.notifications?.length || 0}`);

    // Migrate Users
    console.log('\n👤 Migrating users...');
    for (const user of jsonData.users || []) {
        try {
            const existing = sqlite.getUserById(user.id);
            if (existing) {
                console.log(`   ⏭️ User ${user.email} already exists`);
                continue;
            }

            sqlite.db.prepare(`
        INSERT INTO users (id, email, password, first_name, last_name, artist_name, role, is_banned, ban_reason, application_status, balance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                user.id, user.email, user.password,
                user.firstName, user.lastName, user.artistName,
                user.role || 'user', user.isBanned ? 1 : 0, user.banReason,
                user.applicationStatus || 'NONE', user.balance || 0,
                user.createdAt || new Date().toISOString()
            );
            console.log(`   ✅ User ${user.email} migrated`);
        } catch (e: any) {
            console.log(`   ❌ User ${user.email} failed: ${e.message}`);
        }
    }

    // Migrate Applications
    console.log('\n📝 Migrating applications...');
    for (const app of jsonData.applications || []) {
        try {
            const existing = sqlite.getApplicationByUser(app.userId);
            if (existing) {
                console.log(`   ⏭️ Application for ${app.userId} already exists`);
                continue;
            }

            sqlite.db.prepare(`
        INSERT INTO applications (id, user_id, bio, instagram_url, spotify_url, soundcloud_url, demo_track_url, status, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                app.id, app.userId, app.bio, app.instagramUrl, app.spotifyUrl,
                app.soundcloudUrl, app.demoTrackUrl, app.status || 'PENDING',
                app.submittedAt || new Date().toISOString()
            );
            console.log(`   ✅ Application ${app.id} migrated`);
        } catch (e: any) {
            console.log(`   ❌ Application ${app.id} failed: ${e.message}`);
        }
    }

    // Migrate Releases and Tracks
    console.log('\n💿 Migrating releases and tracks...');
    for (const release of jsonData.releases || []) {
        try {
            const existing = sqlite.getReleaseById(release.id);
            if (existing) {
                console.log(`   ⏭️ Release "${release.title}" already exists`);
                continue;
            }

            sqlite.db.prepare(`
        INSERT INTO releases (id, user_id, title, type, genre, sub_genre, status, cover_url, c_line, c_year, p_line, p_year, record_label, upc, release_date, release_timing, distributed_before, territory, rejection_reason, takedown_requested_at, created_at, selected_stores, monetization)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                release.id, release.userId, release.title, release.type, release.genre, release.subGenre,
                release.status || 'PENDING', release.coverUrl, release.cLine, release.cYear,
                release.pLine, release.pYear, release.recordLabel, release.wupc || release.upc,
                release.releaseDate, release.releaseTiming, release.distributedBefore ? 1 : 0,
                release.territory || 'Global', release.rejectionReason, release.takedownRequestedAt,
                release.createdDate || new Date().toISOString(),
                JSON.stringify(release.selectedStores || []), JSON.stringify(release.monetization || {})
            );
            console.log(`   ✅ Release "${release.title}" migrated`);

            // Migrate tracks for this release
            for (let i = 0; i < (release.tracks || []).length; i++) {
                const track = release.tracks[i];
                const trackId = track.id || `track-${Date.now()}-${i}`;

                sqlite.db.prepare(`
          INSERT INTO tracks (id, release_id, title, version, file_url, isrc, language, is_explicit, lyrics, ai_usage, composition_type, track_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
                    trackId, release.id, track.title, track.version, track.fileUrl,
                    track.isrc, track.language, track.isExplicit ? 1 : 0, track.lyrics,
                    track.aiUsage, track.compositionType, i + 1
                );

                // Migrate track artists
                for (let j = 0; j < (track.artists || []).length; j++) {
                    const artist = track.artists[j];
                    sqlite.db.prepare(`
            INSERT INTO track_artists (id, track_id, name, role, legal_name, spotify_url, apple_id, artist_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
                        `ta-${trackId}-${j}`, trackId, artist.name, artist.role,
                        artist.legalName, artist.spotifyUrl, artist.appleId, j
                    );
                }

                // Migrate track writers
                for (let k = 0; k < (track.writers || []).length; k++) {
                    const writer = track.writers[k];
                    sqlite.db.prepare(`
            INSERT INTO track_writers (id, track_id, name, role, share)
            VALUES (?, ?, ?, ?, ?)
          `).run(
                        `tw-${trackId}-${k}`, trackId, writer.name, writer.role, writer.share || 0
                    );
                }
            }
        } catch (e: any) {
            console.log(`   ❌ Release "${release.title}" failed: ${e.message}`);
        }
    }

    // Migrate Notifications
    console.log('\n🔔 Migrating notifications...');
    for (const notif of jsonData.notifications || []) {
        try {
            sqlite.db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
                notif.id, notif.userId, notif.title, notif.message,
                notif.type || 'info', notif.read ? 1 : 0, notif.createdAt
            );
        } catch (e: any) {
            // Skip duplicates
        }
    }
    console.log(`   ✅ Notifications migrated`);

    // Migrate Artists Library
    console.log('\n🎤 Migrating artists library...');
    for (const artist of jsonData.artists || []) {
        try {
            sqlite.db.prepare(`
        INSERT INTO artists (id, user_id, name, legal_name, spotify_url, apple_id, instagram_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
                artist.id, artist.userId, artist.name, artist.legalName,
                artist.spotifyUrl, artist.appleId, artist.instagramUrl
            );
        } catch (e: any) {
            // Skip duplicates
        }
    }
    console.log(`   ✅ Artists migrated`);

    // Migrate Withdrawals
    console.log('\n💰 Migrating withdrawals...');
    for (const w of jsonData.withdrawals || []) {
        try {
            sqlite.db.prepare(`
        INSERT INTO withdrawals (id, user_id, amount, method, details, status, note, requested_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(w.id, w.userId, w.amount, w.method, w.details, w.status, w.note, w.requestedAt);
        } catch (e: any) {
            // Skip duplicates
        }
    }
    console.log(`   ✅ Withdrawals migrated`);

    // Migrate Earnings
    console.log('\n📊 Migrating earnings...');
    for (const e of jsonData.earnings || []) {
        try {
            sqlite.db.prepare(`
        INSERT INTO earnings (id, user_id, month, amount, streams, downloads)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(e.id, e.userId, e.month, e.amount, e.streams, e.downloads);
        } catch (e: any) {
            // Skip duplicates
        }
    }
    console.log(`   ✅ Earnings migrated`);

    // Migrate Tickets
    console.log('\n🎫 Migrating support tickets...');
    for (const t of jsonData.tickets || []) {
        try {
            sqlite.db.prepare(`
        INSERT INTO tickets (id, user_id, subject, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(t.id, t.userId, t.subject, t.message, t.status, t.createdAt);

            for (const r of t.responses || []) {
                sqlite.db.prepare(`
          INSERT INTO ticket_responses (id, ticket_id, user_id, message, is_admin, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(r.id, t.id, r.userId, r.message, r.isAdmin ? 1 : 0, r.createdAt);
            }
        } catch (e: any) {
            // Skip duplicates
        }
    }
    console.log(`   ✅ Tickets migrated`);

    // Migrate Files
    console.log('\n📁 Migrating files...');
    for (const f of jsonData.files || []) {
        try {
            sqlite.db.prepare(`
        INSERT INTO files (id, user_id, original_name, stored_name, type, size, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(f.id, f.userId, f.originalName, f.storedName, f.type, f.size, f.uploadedAt);
        } catch (e: any) {
            // Skip duplicates
        }
    }
    console.log(`   ✅ Files migrated`);

    console.log('\n✨ Migration complete!');

    // Show stats
    const stats = sqlite.getStats();
    console.log('\n📊 SQLite Database Stats:');
    console.log(`   Users: ${stats.totalUsers}`);
    console.log(`   Releases: ${stats.totalReleases}`);
    console.log(`   Pending: ${stats.pendingReleases}`);
    console.log(`   Approved: ${stats.approvedReleases}`);
};

migrate();
