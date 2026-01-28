import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sqlite } from './database.js';
import { externalAnalyticsService } from './services/externalAnalytics.js';
import { acrCloudService } from './services/acrCloud.js';
import { exec } from 'child_process';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('trust proxy', true); // Trust Caddy/Nginx proxy (all headers)
const PORT = process.env.PORT || 3030;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per 15 mins
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);


// Security: JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production!');
    }
    console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET env var in production!');
    return 'wbbt-dev-secret-' + Date.now();
})();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Security: Allowed file extensions for upload
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

async function generateGeminiContent(parts: any[]) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s Timeout

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: parts
                }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text;
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('Gemini API Error:', error);
        if (error.name === 'AbortError') {
            throw new Error('TIMEOUT');
        }
        throw error;
    }
}


const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Security: CORS Configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'https://app.wbbt.net',
    'https://wbbt.net',
    'https://www.wbbt.net'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, true); // Allow in dev, change to callback(new Error('CORS')) in production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// Security: HTTP Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.originalUrl}`);
    next();
});

// Serve static files
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const DIST_DIR = path.resolve(__dirname, '../dist');
    app.use(express.static(DIST_DIR));

    // Handle SPA routing - send index.html for all non-API routes
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
}

// Security: Rate Limiting for Auth
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT = { maxAttempts: 50, windowMs: 15 * 60 * 1000 }; // 50 attempts per 15 min

const rateLimitMiddleware = (req: any, res: any, next: any) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = loginAttempts.get(ip as string);

    if (record && now - record.lastAttempt < RATE_LIMIT.windowMs) {
        if (record.count >= RATE_LIMIT.maxAttempts) {
            return res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes.' });
        }
        record.count++;
        record.lastAttempt = now;
    } else {
        loginAttempts.set(ip as string, { count: 1, lastAttempt: now });
    }
    next();
};

// Security: Path traversal prevention helper
const isPathSafe = (requestedPath: string, basePath: string): boolean => {
    const resolvedPath = path.resolve(basePath, requestedPath);
    return resolvedPath.startsWith(path.resolve(basePath));
};

// Auth middleware
const checkIpBan = (req: any, res: any, next: any) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const ban = sqlite.isIpBanned(ip);
    if (ban) return res.status(403).json({ error: 'IP_BANNED', reason: (ban as any).reason });
    next();
};

const restrictedMiddleware = (req: any, res: any, next: any) => {
    // If not authenticated, skip check (authMiddleware handles it)
    if (!req.userId) return next();

    // Fetch user to check status (or rely on authMiddleware populating it? authMiddleware only sets userId)
    // We need to fetch user here or cache it. authMiddleware does NOT fetch full user.
    // Optimization: authMiddleware fetches? No, just verifies token.
    // Let's fetch user here if not present.
    const user = sqlite.getUserById(req.userId) as any;
    if (user && user.is_banned) {
        // Allow ONLY specific routes
        const allowedPaths = ['/api/auth/me', '/api/files', '/api/appeal']; // Files needed for assets? Maybe not. Appeal is key.
        // Also allow logout conceptually (frontend just clears token).
        // Check if path starts with allowed
        if (allowedPaths.some(p => req.path.startsWith(p))) {
            return next();
        }
        return res.status(403).json({ error: 'ACCOUNT_BANNED', reason: user.ban_reason });
    }
    next();
};

const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const adminMiddleware = (req: any, res: any, next: any) => {
    const user = sqlite.getUserById(req.userId) as any;
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
    }
    next();
};

const checkAdmin = (userId: string) => {
    const user = sqlite.getUserById(userId) as any;
    return user && user.role === 'admin';
};

// ==================== AI ROUTES ====================

app.post('/api/ai/chat', authMiddleware, async (req: any, res) => {
    try {
        const { messages, persona } = req.body;

        let systemPrompt = "You are Gemini, an expert AI Assistant for WBBT Records.";
        if (persona === 'Producer') systemPrompt = "You are a Grammy-winning Music Producer. Focus on technical details, arrangement, and sound design. Be critical but helpful.";
        if (persona === 'Manager') systemPrompt = "You are a Shark Music Manager. Focus on business, strategy, contracts, and growth. Be direct and strategic.";
        if (persona === 'Lawyer') systemPrompt = "You are an Entertainment Lawyer. Focus on copyright, publishing, and legal protection. Be cautious and precise.";

        const fullHistory = [
            { role: 'user', parts: [{ text: `System Instruction: ${systemPrompt}` }] },
            { role: 'model', parts: [{ text: "Understood. I am ready." }] },
            ...messages.map((msg: any) => ({
                role: msg.sender === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }))
        ];

        // 30 Seconds Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: fullHistory }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            if (!data.candidates || !data.candidates[0]) {
                throw new Error('No response from AI provider (Safety block or empty result)');
            }

            const reply = data.candidates[0].content.parts[0].text;

            res.json({ result: reply });
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('TIMEOUT');
            }
            throw fetchError;
        }

    } catch (error: any) {
        console.error('AI Chat Error:', error);

        let errorMessage = 'Failed to generate chat response';
        let statusCode = 500;

        if (error.message === 'TIMEOUT' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
            errorMessage = 'Connection timed out. Google Gemini API is unreachable.';
            statusCode = 503;
        } else if (error.message.includes('fetch failed')) {
            errorMessage = 'Network connection failed. Please check your internet.';
            statusCode = 503;
        }

        res.status(statusCode).json({ error: errorMessage });
    }
});
app.post('/api/ai/lyrics', authMiddleware, async (req: any, res) => {
    try {
        const { topic, genre, mood } = req.body;
        const prompt = `You are a world-class songwriter and lyricist contributing to a platinum-selling record.
        
        Task: Write complete song lyrics based on the following parameters:
        - Topic/Theme: ${topic}
        - Genre: ${genre}
        - Mood/Vibe: ${mood}

        Requirements:
        1. Structure: Follow a professional structure (Verse 1, Chorus, Verse 2, Chorus, Bridge, Chorus, Outro).
        2. Rhyme & Meter: Use sophisticated rhyme schemes (internal rhymes, slant rhymes) appropriate for the genre. Avoid basic AABB patterns unless stylistic.
        3. Imagery: Use "Show, Don't Tell". Paint vivid pictures with words. Avoid clichés.
        4. Hook: The chorus MUST be catchy, repetitive, and anthemic.
        
        Output:
        Provide ONLY the lyrics, clearly labeled with section headers (e.g., [Verse 1]).`;

        const lyrics = await generateGeminiContent([{ text: prompt }]);
        res.json({ result: lyrics });
    } catch (error: any) {
        console.error('AI Lyrics Error:', error);
        let status = 500;
        let message = 'Failed to generate lyrics';
        if (error.message === 'TIMEOUT') { status = 503; message = 'AI Request Timed Out'; }
        res.status(status).json({ error: message });
    }
});

app.post('/api/ai/pitch', authMiddleware, async (req: any, res) => {
    try {
        const { artistName, trackTitle, genre, features } = req.body;
        const prompt = `You are a Senior Music Publicist at a top-tier PR firm (e.g., Shore Fire, Grandstand).
        
        Task: Write a compelling, high-converting Spotify Pitch for a new single.
        
        Release Details:
        - Artist: ${artistName}
        - Track: ${trackTitle}
        - Genre: ${genre}
        - Key Selling Points: ${features}

        Requirements:
        1. Tone: Professional, urgent, exciting, but grounded. Avoid pure hype; focus on value.
        2. Structure:
           - Hook: One sentence summary utilizing the artist's unique angle.
           - "For Fans Of": Compare to 2-3 relevant successful artists.
           - The Story: Briefly explain why this track matters NOW.
           - Call to Action: Polite push for playlist consideration.
        3. Length: Concise (under 300 words). Editors are busy.

        Output:
        Provide the pitch text only.`;

        const pitch = await generateGeminiContent([{ text: prompt }]);
        res.json({ result: pitch });
    } catch (error: any) {
        console.error('AI Pitch Error:', error);
        let status = 500;
        let message = 'Failed to generate pitch';
        if (error.message === 'TIMEOUT') { status = 503; message = 'AI Request Timed Out'; }
        res.status(status).json({ error: message });
    }
});

app.post('/api/ai/image', authMiddleware, async (req: any, res) => {
    try {
        const { prompt } = req.body;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
        res.json({ result: imageUrl });
    } catch (error: any) {
        console.error('AI Image Error:', error);
        // Pollinations usually doesn't timeout in the same way, but good to catch
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

app.post('/api/ai/analyze-audio', authMiddleware, async (req: any, res) => {
    try {
        const { audioData, mimeType } = req.body; // Expecting base64 string

        if (!audioData) return res.status(400).json({ error: 'No audio data provided' });

        const prompt = `You are a Grammy-winning Mastering Engineer and Audio Physicist.
        
        Task: Perform a deep technical analysis of the provided audio track.
        
        Your Analysis Report must cover:
        1. **Genre & Vibe Classification**: Precise sub-genre identification.
        2. **Frequency Spectrum**: Analysis of Lows (Kick/Bass relationship), Mids (Vocal presence/clarity), and Highs (Air/Brilliance).
        3. **Dynamic Range & Loudness**: Perceived loudness, transient response, and compression levels.
        4. **Stereo Field**: Width, separation, and phase coherence.
        5. **Production Quality**: Identify strengths (e.g., "tight low end") and weaknesses (e.g., "muddy 200Hz region", "sibilant vocals").
        6. **Mastering Suggestions**: Specific EQ moves, compression settings, or saturation ideas to take this to a commercial level.

        Tone: Clinical, encouraging, and highly technical but accessible.
        Format: Markdown.`;

        const analysis = await generateGeminiContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: mimeType || 'audio/mp3',
                    data: audioData
                }
            }
        ]);

        res.json({ result: analysis });
    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        let status = 500;
        let message = 'Failed to analyze audio';
        if (error.message === 'TIMEOUT') { status = 503; message = 'AI Request Timed Out'; }
        res.status(status).json({ error: message });
    }
});

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', checkIpBan, rateLimitMiddleware, (req: any, res) => {
    const { email, password } = req.body;
    const user = sqlite.getUserByEmail(email) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    sqlite.updateUserIp(user.id, ip);

    // If banned, allow login but status indicates ban (Frontend handles view)
    // Actually, user requested "giriş yapsa bile..." (even if they log in).
    // So we return success, but `user.isBanned` is true.

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...userData } = user;

    res.json({
        token,
        user: {
            ...userData,
            firstName: user.first_name,
            lastName: user.last_name,
            artistName: user.artist_name,
            isBanned: user.is_banned,
            banReason: user.ban_reason,
            applicationStatus: user.application_status,
            createdAt: user.created_at
        }
    });
});



app.post('/api/auth/signup', rateLimitMiddleware, (req, res) => {
    const { email, password, firstName, lastName, artistName } = req.body;

    // Password Complexity Check
    const isStrong =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);

    if (!isStrong) {
        return res.status(400).json({ error: 'Password must be at least 8 chars and include uppercase, lowercase, number, and symbol.' });
    }

    if (sqlite.getUserByEmail(email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = `user-${Date.now()}`;
    const hashedPassword = bcrypt.hashSync(password, 10);


    sqlite.db.prepare(`
    INSERT INTO users (id, email, password, first_name, last_name, artist_name, role, application_status, balance)
    VALUES (?, ?, ?, ?, ?, ?, 'user', 'NONE', 0)
  `).run(userId, email, hashedPassword, firstName, lastName, artistName);

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
    const user = sqlite.getUserById(userId) as any;
    const { password: _, ...userData } = user;

    res.json({
        token,
        user: {
            ...userData,
            firstName: user.first_name,
            lastName: user.last_name,
            artistName: user.artist_name,
            applicationStatus: user.application_status
        }
    });
});

// Appeal Routes
app.get('/api/appeal', authMiddleware, (req: any, res) => {
    const user = sqlite.getUserById(req.userId) as any;
    if (!user.ban_ticket_id) return res.json({ ticket: null });

    const ticket = sqlite.get(
        `SELECT t.*, 
            (SELECT COUNT(*) FROM ticket_responses WHERE ticket_id = t.id) as responseCount
            FROM tickets t WHERE id = ?`,
        [user.ban_ticket_id]
    ) as any;

    if (ticket) {
        // Include responses
        ticket.responses = sqlite.getTicketResponses(ticket.id)
            .map((r: any) => ({ ...r, createdAt: r.created_at }));
    }
    res.json({ ticket });
});

app.post('/api/appeal', authMiddleware, (req: any, res) => {
    const { message } = req.body;
    const user = sqlite.getUserById(req.userId) as any;

    if (!user.is_banned) return res.status(400).json({ error: 'Not banned' });
    if (user.ban_ticket_id) {
        return res.status(400).json({ error: 'Appeal already open' });
    }

    const ticketId = `ticket-${Date.now()}`;
    sqlite.createTicket({ id: ticketId, userId: req.userId, subject: 'Ban Appeal', message: message });
    sqlite.setBanTicket(req.userId, ticketId);
    res.json({ success: true, ticketId });
});

app.put('/admin/users/:id/ban', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { reason, banIp } = req.body;

    // Ban user
    sqlite.updateUser(id, { is_banned: 1, ban_reason: reason });

    // Ban IP
    if (banIp) {
        const user = sqlite.getUserById(id) as any;
        if (user.last_ip) {
            sqlite.banIp(user.last_ip, reason);
        }
    }
    res.json({ success: true });
});

app.put('/admin/users/:id/unban', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    sqlite.updateUser(id, { is_banned: 0, ban_reason: null, ban_ticket_id: null });
    res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, (req: any, res) => {
    const user = sqlite.getUserById(req.userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Remove password
    const { password: _, ...userData } = user;
    res.json({
        user: {
            ...userData,
            firstName: user.first_name,
            lastName: user.last_name,
            artistName: user.artist_name,
            spotifyUrl: user.spotify_url,
            youtubeUrl: user.youtube_url,
            isBanned: user.is_banned,
            banReason: user.ban_reason,
            applicationStatus: user.application_status,
            createdAt: user.created_at,
            banTicketId: user.ban_ticket_id
        }
    });
});

// Admin Update User (incl. Social links)
app.put('/api/admin/releases/:id', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const updates = req.body;

    const release = sqlite.getReleaseById(id) as any;
    if (!release) return res.status(404).json({ error: 'Release not found' });

    // Allow updating almost anything
    sqlite.updateRelease(id, {
        title: updates.title,
        type: updates.type,
        genre: updates.genre,
        subGenre: updates.subGenre,
        upc: updates.upc,
        wupc: updates.wupc,
        releaseDate: updates.releaseDate,
        releaseTiming: updates.releaseTiming,
        distributedBefore: updates.distributedBefore,
        territory: updates.territory,
        pLine: updates.pLine,
        cLine: updates.cLine,
        recordLabel: updates.recordLabel,
        mainArtist: updates.mainArtist, // If this changes, we might want to sync social accounts again?
        status: updates.status, // Allow status override specifically
        rejectionReason: updates.rejectionReason,
        originalReleaseDate: updates.originalReleaseDate
    });

    res.json({ success: true });
});

app.put('/api/admin/tracks/:id', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const updates = req.body;

    sqlite.updateTrack(id, updates);

    if (updates.artists && Array.isArray(updates.artists)) {
        sqlite.updateTrackArtists(id, updates.artists);
    }

    res.json({ success: true });
});

app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { spotifyUrl, youtubeUrl, artistName } = req.body;

    const updates: any = {};
    if (spotifyUrl !== undefined) updates.spotify_url = spotifyUrl;
    if (youtubeUrl !== undefined) updates.youtube_url = youtubeUrl;
    if (artistName !== undefined) updates.artist_name = artistName; // Allow name fix too

    sqlite.updateUser(id, updates);
    res.json({ success: true });
});

app.post('/api/admin/system-update', authMiddleware, adminMiddleware, (req: any, res) => {
    console.log('[System Update] Triggered by user:', req.userId);

    const scriptPath = path.join(__dirname, '..', 'update.sh');

    exec(`bash "${scriptPath}"`, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[System Update] Error: ${error.message}`);
            return res.status(500).json({ error: 'Update failed', details: stderr });
        }
        if (stderr) {
            console.warn(`[System Update] Stderr: ${stderr}`);
        }
        console.log(`[System Update] Output: ${stdout}`);
        res.json({ success: true, message: 'Update process started', output: stdout });
    });
});

// Background function to fetch and cache analytics data
async function fetchAndCacheAnalytics(userId: string, user: any, date: string) {
    try {
        const socialAccounts = sqlite.getSocialAccountsByUser(userId) as any[];

        const spotifyAccounts = socialAccounts.filter(a => a.platform === 'spotify').map(a => ({ url: a.url, name: a.name }));
        const youtubeAccounts = socialAccounts.filter(a => a.platform === 'youtube').map(a => ({ url: a.url, name: a.name }));

        if (spotifyAccounts.length === 0 && user.spotify_url) {
            spotifyAccounts.push({ url: user.spotify_url, name: user.artist_name });
        }
        if (youtubeAccounts.length === 0 && user.youtube_url) {
            youtubeAccounts.push({ url: user.youtube_url, name: user.artist_name });
        }

        const [spotifyData, youtubeData] = await Promise.all([
            spotifyAccounts.length > 0
                ? externalAnalyticsService.getAggregatedSpotifyStats(spotifyAccounts)
                : { accounts: [], totals: { followers: 0, averagePopularity: 0, monthlyListeners: 0, accountCount: 0 } },
            youtubeAccounts.length > 0
                ? externalAnalyticsService.getAggregatedYouTubeStats(youtubeAccounts)
                : { accounts: [], totals: { subscribers: 0, totalViews: 0, videoCount: 0, accountCount: 0 } }
        ]);

        const spotifyResponse = {
            followers: spotifyData.totals.followers,
            popularity: spotifyData.totals.averagePopularity,
            monthlyListeners: spotifyData.totals.monthlyListeners || null,
            accounts: spotifyData.accounts
        };
        const youtubeResponse = {
            subscribers: youtubeData.totals.subscribers,
            totalViews: youtubeData.totals.totalViews,
            videoCount: youtubeData.totals.videoCount,
            accounts: youtubeData.accounts
        };

        sqlite.setDailyCache(userId, date, spotifyResponse, youtubeResponse);
        console.log(`[Background Refresh] User ${userId} - cached fresh data for ${date}`);
    } catch (e) {
        console.error(`[Background Refresh] User ${userId} - failed:`, e);
    }
}

app.get('/api/analytics/external', authMiddleware, async (req: any, res) => {
    try {
        const user = sqlite.getUserById(req.userId) as any;
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Get all social accounts for this user
        const socialAccounts = sqlite.getSocialAccountsByUser(req.userId) as any[];

        const spotifyAccounts = socialAccounts.filter(a => a.platform === 'spotify').map(a => ({ url: a.url, name: a.name }));
        const youtubeAccounts = socialAccounts.filter(a => a.platform === 'youtube').map(a => ({ url: a.url, name: a.name }));

        // Fallback to legacy single URL fields if no accounts exist
        if (spotifyAccounts.length === 0 && user.spotify_url) {
            spotifyAccounts.push({ url: user.spotify_url, name: user.artist_name });
        }
        if (youtubeAccounts.length === 0 && user.youtube_url) {
            youtubeAccounts.push({ url: user.youtube_url, name: user.artist_name });
        }

        const [spotifyData, youtubeData] = await Promise.all([
            spotifyAccounts.length > 0
                ? externalAnalyticsService.getAggregatedSpotifyStats(spotifyAccounts)
                : { accounts: [], totals: { followers: 0, averagePopularity: 0, monthlyListeners: 0, accountCount: 0 } },
            youtubeAccounts.length > 0
                ? externalAnalyticsService.getAggregatedYouTubeStats(youtubeAccounts)
                : { accounts: [], totals: { subscribers: 0, totalViews: 0, videoCount: 0, accountCount: 0 } }
        ]);

        // Build response objects
        const spotifyResponse = {
            followers: spotifyData.totals.followers,
            popularity: spotifyData.totals.averagePopularity,
            monthlyListeners: spotifyData.totals.monthlyListeners || null,
            accounts: spotifyData.accounts
        };
        const youtubeResponse = {
            subscribers: youtubeData.totals.subscribers,
            totalViews: youtubeData.totals.totalViews,
            videoCount: youtubeData.totals.videoCount,
            accounts: youtubeData.accounts
        };

        // Return fresh data (Apify has internal 1-hour cache for monthly listeners)
        res.json({
            spotify: spotifyResponse,
            youtube: youtubeResponse
        });

        // Auto-record monthly data (once per month)
        const now = new Date();
        const currentMonth = now.toLocaleString('en-US', { month: 'short' });
        const currentYear = now.getFullYear();
        const historyId = `history-${req.userId}-${currentYear}-${currentMonth}`;

        try {
            sqlite.recordMonthlyListeners({
                id: historyId,
                userId: req.userId,
                platform: 'spotify',
                month: currentMonth,
                year: currentYear,
                monthlyListeners: spotifyData.totals.monthlyListeners || 0,
                followers: spotifyData.totals.followers || 0
            });
        } catch (e) {
            // Ignore if already recorded this month
        }

    } catch (e) {
        console.error('External Analytics Error:', e);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Admin: Get analytics for a specific user
app.get('/api/admin/users/:id/analytics', authMiddleware, adminMiddleware, async (req: any, res) => {
    const { id } = req.params;
    try {
        const cache = sqlite.getLatestCache(id) as any;
        if (cache) {
            res.json({
                spotify: JSON.parse(cache.spotify_data),
                youtube: JSON.parse(cache.youtube_data),
                date: cache.cache_date
            });
        } else {
            res.json({ spotify: null, youtube: null });
        }
    } catch (e) {
        console.error('Admin Analytics Error:', e);
        res.status(500).json({ error: 'Failed to fetch user analytics' });
    }
});

// Get monthly listeners history for charts
app.get('/api/analytics/history', authMiddleware, (req: any, res) => {
    try {
        const history = sqlite.getMonthlyListenersHistory(req.userId, 12) as any[];

        // Format for charts - reverse to show oldest first
        const chartData = history.reverse().map(h => ({
            month: `${h.month} ${h.year}`,
            monthlyListeners: h.monthly_listeners,
            followers: h.followers
        }));

        res.json({ history: chartData });
    } catch (e) {
        console.error('Analytics History Error:', e);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// ==================== SOCIAL ACCOUNTS ====================

app.get('/api/social-accounts', authMiddleware, (req: any, res) => {
    const accounts = sqlite.getSocialAccountsByUser(req.userId) as any[];
    res.json({
        accounts: accounts.map(a => ({
            id: a.id,
            platform: a.platform,
            url: a.url,
            platformId: a.platform_id,
            name: a.name,
            artistLibraryId: a.artist_library_id,
            createdAt: a.created_at
        }))
    });
});

app.post('/api/social-accounts', authMiddleware, (req: any, res) => {
    const { platform, url, name, artistLibraryId } = req.body;

    if (!platform || !url) {
        return res.status(400).json({ error: 'Platform and URL are required' });
    }

    // Extract platform ID from URL
    let platformId = null;
    if (platform === 'spotify') {
        const match = url.match(/artist\/([a-zA-Z0-9]+)/);
        platformId = match ? match[1] : null;
    } else if (platform === 'youtube') {
        const channelMatch = url.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
        const handleMatch = url.match(/@([a-zA-Z0-9_-]+)/);
        platformId = channelMatch ? channelMatch[1] : (handleMatch ? handleMatch[1] : null);
    }

    const accountId = `social-${Date.now()}`;
    sqlite.createSocialAccount({
        id: accountId,
        userId: req.userId,
        artistLibraryId: artistLibraryId || null,
        platform,
        url,
        platformId,
        name
    });

    res.json({ success: true, accountId });
});

app.delete('/api/social-accounts/:id', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const account = sqlite.getSocialAccountById(id) as any;

    if (!account) {
        return res.status(404).json({ error: 'Account not found' });
    }

    // Only allow deletion if user owns the account or is admin
    const user = sqlite.getUserById(req.userId) as any;
    if (account.user_id !== req.userId && user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
    }

    sqlite.deleteSocialAccount(id);
    res.json({ success: true });
});

// Admin: Get social accounts for any user
app.get('/api/admin/users/:id/social-accounts', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const accounts = sqlite.getSocialAccountsByUser(id) as any[];
    res.json({
        accounts: accounts.map(a => ({
            id: a.id,
            platform: a.platform,
            url: a.url,
            platformId: a.platform_id,
            name: a.name,
            createdAt: a.created_at
        }))
    });
});

// Admin: Add social account for any user
app.post('/api/admin/users/:id/social-accounts', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { platform, url, name } = req.body;

    if (!platform || !url) {
        return res.status(400).json({ error: 'Platform and URL are required' });
    }

    let platformId = null;
    if (platform === 'spotify') {
        const match = url.match(/artist\/([a-zA-Z0-9]+)/);
        platformId = match ? match[1] : null;
    } else if (platform === 'youtube') {
        const channelMatch = url.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
        const handleMatch = url.match(/@([a-zA-Z0-9_-]+)/);
        platformId = channelMatch ? channelMatch[1] : (handleMatch ? handleMatch[1] : null);
    }

    const accountId = `social-${Date.now()}`;
    sqlite.createSocialAccount({
        id: accountId,
        userId: id,
        platform,
        url,
        platformId,
        name
    });

    res.json({ success: true, accountId });
});

// Search YouTube channel by artist name
app.get('/api/youtube/search', authMiddleware, async (req: any, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const results = await externalAnalyticsService.searchYouTubeChannel(query as string);
    res.json({ channels: results || [] });
});

app.put('/api/admin/releases/:id', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Use the existing updateRelease function which should handle partial updates
    // Note: database.ts updateRelease might expect a full object or specific structure. 
    // Let's use a direct update query for safety or mapping if needed. 
    // Checking database.ts, updateRelease maps frontend keys to db columns.
    sqlite.updateRelease(id, updates);
    res.json({ success: true });
});

// Takedown Routes
app.put('/api/releases/:id/takedown', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const release = sqlite.getReleaseById(id) as any;
    if (!release || release.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
    }
    sqlite.requestTakedown(id);
    res.json({ success: true });
});

app.post('/api/releases/:id/approve-takedown', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;
    sqlite.approveTakedown(id);
    res.json({ success: true });
});

// ==================== FILE UPLOAD ====================

app.post('/api/upload', authMiddleware, (req: any, res) => {
    const { filename, data, type, artistName } = req.body;

    if (!data || !filename) {
        return res.status(400).json({ error: 'Missing file data or filename' });
    }

    // Security: Validate file extension
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({ error: `File type '${ext}' not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` });
    }

    // Security: Sanitize filename to prevent path traversal
    const sanitizedFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const storedFilename = `${fileId}${ext}`;

    let uploadPath = UPLOADS_DIR;
    if (artistName) {
        const safeArtistName = artistName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        uploadPath = path.join(UPLOADS_DIR, safeArtistName);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
    }

    const filePath = path.join(uploadPath, storedFilename);
    const base64Data = data.replace(/^data:[^;]+;base64,/, '');

    try {
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        const storedName = artistName
            ? `${artistName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/${storedFilename}`
            : storedFilename;

        sqlite.createFile({
            id: fileId,
            userId: req.userId,
            originalName: filename,
            storedName: storedName,
            type: type || 'unknown',
            size: fs.statSync(filePath).size
        });

        res.json({ success: true, fileId, url: `/api/files/${fileId}` });
    } catch (e) {
        console.error('File upload error:', e);
        res.status(500).json({ error: 'Failed to save file' });
    }
});


app.get('/api/files/:id', (req, res) => {
    const { id } = req.params;
    const file = sqlite.getFileById(id) as any;

    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    // Security: Prevent path traversal attacks
    if (!isPathSafe(file.stored_name, UPLOADS_DIR)) {
        console.error(`Path traversal attempt blocked: ${file.stored_name}`);
        return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(UPLOADS_DIR, file.stored_name);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
    }

    // Determine if this is an image (serve inline for preview)
    const ext = path.extname(file.original_name).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const isImage = imageExtensions.includes(ext);

    // Set appropriate content type
    const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp'
    };
    if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
    }

    // For images/PDFs, serve inline (allows preview); for other files, serve as attachment
    if (isImage || ext === '.pdf') {
        res.setHeader('Content-Disposition', 'inline');
        if (ext === '.pdf') res.setHeader('Content-Type', 'application/pdf');
    } else {
        const safeFilename = encodeURIComponent(file.original_name).replace(/'/g, '%27');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeFilename}`);
    }

    res.sendFile(filePath);
});

// ==================== ARTIST LIBRARY ====================

app.get('/api/artists', authMiddleware, (req: any, res) => {
    const artists = sqlite.getArtistsByUser(req.userId) as any[];
    res.json({
        artists: artists.map((a: any) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            legalName: a.legal_name,
            spotifyUrl: a.spotify_url,
            appleId: a.apple_id
        }))
    });
});

app.post('/api/artists', authMiddleware, (req: any, res) => {
    const { name, role, legalName, spotifyUrl, appleId } = req.body;
    const id = `artist-${Date.now()}`;
    sqlite.createArtistLibrary({
        id,
        userId: req.userId,
        name,
        role: role || 'Primary Artist',
        legalName: legalName || '',
        spotifyUrl: spotifyUrl || '',
        appleId: appleId || ''
    });
    res.json({ id, name, role, legalName, spotifyUrl, appleId });
});

// ==================== WRITER LIBRARY ====================

app.get('/api/writers', authMiddleware, (req: any, res) => {
    const writers = sqlite.getWritersByUser(req.userId) as any[];
    res.json({
        writers: writers.map((w: any) => ({
            id: w.id,
            name: w.name,
            role: w.role,
            legalName: w.legal_name,
        }))
    });
});

app.post('/api/writers', authMiddleware, (req: any, res) => {
    const { name, role, legalName } = req.body;
    const id = `writer-${Date.now()}`;
    sqlite.createWriterLibrary({
        id,
        userId: req.userId,
        name,
        role: role || 'Songwriter',
        legalName: legalName || ''
    });
    res.json({ id, name, role, legalName });
});

// ==================== TICKETS ====================

app.get('/api/tickets', authMiddleware, (req: any, res) => {
    const isAdmin = checkAdmin(req.userId);
    if (isAdmin) {
        const tickets = sqlite.getAllTickets() as any[];
        // Enrich with responses for Admin too
        const ticketsWithMessages = tickets.map(t => ({
            ...t,
            createdAt: t.created_at, // Map snake_case to camelCase for consistency
            responses: sqlite.getTicketResponses(t.id).map((r: any) => ({ ...r, createdAt: r.created_at }))
        }));
        res.json(ticketsWithMessages);
    } else {
        const tickets = sqlite.getTicketsByUser(req.userId) as any[];
        const ticketsWithMessages = tickets.map(t => ({
            ...t,
            createdAt: t.created_at, // Map snake_case to camelCase
            responses: sqlite.getTicketResponses(t.id).map((r: any) => ({ ...r, createdAt: r.created_at }))
        }));
        res.json(ticketsWithMessages);
    }
});

app.post('/api/tickets', authMiddleware, (req: any, res) => {
    const { subject, message } = req.body;
    const id = `ticket-${Date.now()}`;
    sqlite.createTicket({ id, userId: req.userId, subject, message });
    res.json({ success: true, id });
});

app.get('/api/tickets/:id/messages', authMiddleware, (req: any, res) => {
    const messages = sqlite.getTicketResponses(req.params.id);
    res.json(messages);
});

app.post('/api/tickets/:id/response', authMiddleware, (req: any, res) => {
    const { message } = req.body;
    const isAdmin = checkAdmin(req.userId);
    const id = `resp-${Date.now()}`;
    sqlite.createTicketResponse({ id, ticketId: req.params.id, userId: req.userId, message, isAdmin });

    // Send Notification to User if Admin replied
    if (isAdmin) {
        // We need the ticket owner ID. Since we don't have it easily, we can fetch the ticket?
        // Or we rely on the client? No, backend.
        // For now, let's assume we can notify. 
        // We need 'sqlite.getTicketById'.
        // Let's modify database.ts or add a quick query here?
        // Better: index-sqlite shouldn't do raw queries.
        // I will assume getTicketsByUser or similar can help, but inefficient.
        // Warning: I might need to add getTicketById to database.ts if missing.
        // Assuming it's missing, I'll skip notification or add it blindly if I can query it?
        // sqlite.db is exposed? Yes.
        try {
            const ticket = sqlite.db.prepare('SELECT user_id, subject FROM tickets WHERE id = ?').get(req.params.id) as any;
            if (ticket) {
                sqlite.createNotification({
                    id: `notif-${Date.now()}`,
                    userId: ticket.user_id,
                    title: 'New Support Reply',
                    message: `Admin replied to: ${ticket.subject}`,
                    type: 'info'
                });
            }
        } catch (e) {
            console.error('Failed to notify user', e);
        }
    }

    res.json({ success: true });
});

app.post('/api/tickets/:id/close', authMiddleware, (req: any, res) => {
    sqlite.closeTicket(req.params.id);
    res.json({ success: true });
});

// ==================== TAKEDOWN ====================

app.post('/api/releases/:id/takedown', authMiddleware, (req: any, res) => {
    sqlite.requestTakedown(req.params.id);
    res.json({ success: true });
});

app.post('/api/releases/:id/approve-takedown', authMiddleware, (req: any, res) => {
    if (!checkAdmin(req.userId)) return res.status(403).json({ error: 'Admin only' });
    sqlite.approveTakedown(req.params.id);
    res.json({ success: true });
});

// ==================== WRITER LIBRARY ====================

app.get('/api/writers', authMiddleware, (req: any, res) => {
    const writers = sqlite.getWritersByUser(req.userId) as any[];
    res.json({
        writers: writers.map((w: any) => ({
            id: w.id,
            name: w.name,
            role: w.role,
            legalName: w.legal_name
        }))
    });
});

app.post('/api/writers', authMiddleware, (req: any, res) => {
    const { name, role, legalName } = req.body;
    const id = `writer-${Date.now()}`;
    sqlite.createWriterLibrary({
        id,
        userId: req.userId,
        name,
        role: role || 'Songwriter',
        legalName: legalName || name
    });
    res.json({ id, name, role, legalName });
});

// ==================== RELEASES ====================

app.get('/api/tracks/:id/copyright', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    try {
        const check = sqlite.db.prepare('SELECT * FROM copyright_checks WHERE track_id = ? ORDER BY id DESC LIMIT 1').get(id) as any;

        if (!check) {
            return res.json(null);
        }

        // Parse match_data if present
        if (check.match_data) {
            try {
                check.matchData = JSON.parse(check.match_data);
            } catch (e) {
                check.matchData = {};
            }
        }

        res.json({
            status: check.status,
            matchData: check.matchData,
            checks: check // Include full object if needed
        });
    } catch (error) {
        console.error('Error fetching copyright status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper to format release with tracks
const formatRelease = (release: any) => {
    const tracks = sqlite.getTracksByRelease(release.id) as any[];
    const formattedTracks = tracks.map((t: any) => {
        const artists = sqlite.getArtistsByTrack(t.id) as any[];
        const writers = sqlite.getWritersByTrack(t.id) as any[];
        return {
            id: t.id,
            title: t.title,
            version: t.version,
            fileUrl: t.file_url,
            isrc: t.isrc,
            wisrc: t.wisrc,
            language: t.language,
            isExplicit: !!t.is_explicit,
            lyrics: t.lyrics,
            aiUsage: t.ai_usage,
            compositionType: t.composition_type,
            genre: t.genre,
            subGenre: t.sub_genre,
            isInstrumental: !!t.is_instrumental,
            copyrightType: t.copyright_type,
            artists: artists.map((a: any) => ({
                name: a.name,
                role: a.role,
                legalName: a.legal_name,
                spotifyUrl: a.spotify_url,
                appleId: a.apple_id
            })),
            writers: writers.map((w: any) => ({
                name: w.name,
                role: w.role,
                legalName: w.legal_name,
                share: w.share
            }))
        };
    });

    return {
        id: release.id,
        userId: release.user_id,
        title: release.title,
        type: release.type,
        genre: release.genre,
        subGenre: release.sub_genre,
        status: release.status,
        coverUrl: release.cover_url,
        cLine: release.c_line,
        cYear: release.c_year,
        pLine: release.p_line,
        pYear: release.p_year,
        recordLabel: release.record_label,
        upc: release.upc,
        wupc: release.wupc,
        releaseDate: release.release_date,
        releaseTiming: release.release_timing,
        distributedBefore: !!release.distributed_before,
        territory: release.territory,
        rejectionReason: release.rejection_reason,
        takedownRequestedAt: release.takedown_requested_at,
        createdDate: release.created_at,
        mainArtist: release.main_artist,
        originalReleaseDate: release.original_release_date,
        selectedStores: JSON.parse(release.selected_stores || '[]'),
        monetization: JSON.parse(release.monetization || '{}'),
        documents: JSON.parse(release.documents || '[]'),
        tracks: formattedTracks
    };
};

app.post('/api/tracks/:id/scan', authMiddleware, async (req: any, res) => {
    const { id } = req.params;
    try {
        const track = sqlite.db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as any;
        if (!track) return res.status(404).json({ error: 'Track not found' });

        if (!track.file_url) return res.status(400).json({ error: 'No audio file associated with this track' });

        const fileId = track.file_url.split('/').pop();
        if (!fileId) return res.status(400).json({ error: 'Invalid file URL' });

        const file = sqlite.getFileById(fileId) as any;
        if (!file) return res.status(404).json({ error: 'File record not found' });

        const filePath = path.join(UPLOADS_DIR, file.stored_name);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Audio file not found on disk' });
        }

        // Trigger Analysis
        const checkId = `cpy-man-${Date.now()}`;
        sqlite.run('INSERT INTO copyright_checks (id, track_id, status) VALUES (?, ?, ?)', [checkId, id, 'PENDING']);

        // Async processing
        (async () => {
            console.log(`[ACR-Manual] Analyzing ${filePath}`);
            const result = await acrCloudService.identify(filePath);

            let status = 'NO_MATCH';
            if (result.success && result.data && result.data.status && result.data.status.code === 0 && result.data.metadata && result.data.metadata.music && result.data.metadata.music.length > 0) {
                status = 'MATCH';
            } else if (!result.success) {
                status = 'ERROR';
            }

            sqlite.run('UPDATE copyright_checks SET status = ?, match_data = ? WHERE id = ?',
                [status, JSON.stringify(result.data || {}), checkId]);
            console.log(`[ACR-Manual] Result for ${track.title}: ${status}`);
        })();

        res.json({ success: true, status: 'PENDING' });

    } catch (error) {
        console.error('Scan Error:', error);
        res.status(500).json({ error: 'Scan failed' });
    }
});

app.get('/api/releases', authMiddleware, (req: any, res) => {
    const user = sqlite.getUserById(req.userId) as any;
    let releases: any[];

    if (user.role === 'admin') {
        releases = sqlite.getAllReleases() as any[];
    } else {
        releases = sqlite.getReleasesByUser(req.userId) as any[];
    }

    const formattedReleases = releases.map(formatRelease);
    res.json({ releases: formattedReleases });
});

app.post('/api/releases', authMiddleware, (req: any, res) => {
    const data = req.body;
    const releaseId = `rel-${Date.now()}`;

    // Use provided UPC or auto-generate
    const providedUpc = data.upc;
    if (!providedUpc || providedUpc.trim() === '') {
        const randomPart = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
        data.upc = `WBBT${randomPart}`;
    } else {
        data.upc = providedUpc;
    }

    // Auto-generate WUPC (Internal) - uses WBBT prefix
    data.wupc = `WBBT${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

    // Create release
    sqlite.createRelease({
        id: releaseId,
        userId: req.userId,
        title: data.title,
        type: data.type,
        genre: data.genre,
        subGenre: data.subGenre,
        status: 'PENDING',
        coverUrl: data.coverUrl,
        cLine: data.cLine,
        cYear: data.cYear,
        pLine: data.pLine,
        pYear: data.pYear,
        recordLabel: data.recordLabel,
        upc: data.upc,
        wupc: data.wupc,  // Add the auto-generated WUPC
        releaseDate: data.releaseDate,
        releaseTiming: data.releaseTiming,
        distributedBefore: data.distributedBefore,
        territory: data.territory,
        selectedStores: data.selectedStores,
        monetization: data.monetization,
        documents: data.documents,
        mainArtist: data.mainArtist,
        originalReleaseDate: data.originalReleaseDate,
        confirmations: data.confirmations
    });

    // Background Job: Analyze Tracks with ACRCloud
    (async () => {
        try {
            console.log(`[ACR] Starting analysis for release ${releaseId}`);
            for (let i = 0; i < (data.tracks || []).length; i++) {
                const track = data.tracks[i];
                // Only analyze if audio file is present
                if (track.fileUrl) {
                    const trackId = `track-${releaseId}-${i}`;

                    // Extract File ID from URL
                    const fileId = track.fileUrl.split('/').pop();
                    if (!fileId) continue;

                    // Get File Record
                    const file = sqlite.getFileById(fileId) as any;
                    if (!file) continue;

                    // Determine upload path
                    const filePath = path.join(UPLOADS_DIR, file.stored_name);

                    if (fs.existsSync(filePath)) {
                        // Create Pending Record
                        const checkId = `chk-${Date.now()}-${i}`;
                        sqlite.createCopyrightCheck({
                            id: checkId,
                            trackId: trackId,
                            status: 'PENDING',
                            matchData: '{}'
                        });

                        console.log(`[ACR] Analyzing ${track.title} (${fileId})...`);
                        const result = await acrCloudService.identify(filePath);

                        let status = 'NO_MATCH';
                        // Check result.success and result.data
                        if (result.success && result.data && result.data.status && result.data.status.code === 0 && result.data.metadata && result.data.metadata.music && result.data.metadata.music.length > 0) {
                            status = 'MATCH';
                        } else if (!result.success) {
                            status = 'ERROR';
                        }

                        console.log(`[ACR] Result for ${track.title}: ${status}`);

                        sqlite.run('UPDATE copyright_checks SET status = ?, match_data = ? WHERE id = ?',
                            [status, JSON.stringify(result.data || {}), checkId]);
                    }
                }
            }
        } catch (e) {
            console.error('[ACR] Analysis Background Job Error', e);
        }
    })();

    // Create tracks
    for (let i = 0; i < (data.tracks || []).length; i++) {
        const track = data.tracks[i];
        const trackId = `track-${releaseId}-${i}`;

        sqlite.createTrack({
            id: trackId,
            releaseId: releaseId,
            title: track.title,
            version: track.version,
            fileUrl: track.fileUrl,
            isrc: track.isrc,
            wisrc: `WTRK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}${i}`,
            language: track.language,
            isExplicit: track.isExplicit,
            lyrics: track.lyrics,
            aiUsage: track.aiUsage,
            compositionType: track.compositionType,
            trackNumber: i + 1,
            genre: track.genre,
            subGenre: track.subGenre,
            isInstrumental: track.isInstrumental,
            copyrightType: track.copyrightType
        });

        // Create track artists
        for (let j = 0; j < (track.artists || []).length; j++) {
            const artist = track.artists[j];
            sqlite.createTrackArtist({
                id: `ta-${trackId}-${j}`,
                trackId: trackId,
                name: artist.name,
                role: artist.role,
                legalName: artist.legalName,
                spotifyUrl: artist.spotifyUrl,
                appleId: artist.appleId,
                order: j
            });
        }

        // Create track writers
        for (let k = 0; k < (track.writers || []).length; k++) {
            const writer = track.writers[k];
            sqlite.createTrackWriter({
                id: `tw-${trackId}-${k}`,
                trackId: trackId,
                name: writer.name,
                legalName: writer.legalName,
                role: writer.role,
                share: writer.share
            });
        }
    }

    sqlite.createLog({ level: 'SUCCESS', message: 'Release Submitted', details: `Title: ${data.title}, ID: ${releaseId}`, userId: req.userId });

    res.json({ success: true, releaseId });
});

app.put('/api/releases/:id', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const data = req.body;

    const release = sqlite.getReleaseById(id) as any;
    if (!release) {
        return res.status(404).json({ error: 'Release not found' });
    }

    // Update release
    sqlite.updateRelease(id, {
        title: data.title,
        type: data.type,
        genre: data.genre,
        subGenre: data.subGenre,
        coverUrl: data.coverUrl,
        cLine: data.cLine,
        cYear: data.cYear,
        pLine: data.pLine,
        pYear: data.pYear,
        recordLabel: data.recordLabel,
        upc: data.upc, // User-entered UPC
        releaseDate: data.releaseDate,
        releaseTiming: data.releaseTiming,
        distributedBefore: data.distributedBefore,
        territory: data.territory,
        selectedStores: data.selectedStores,
        monetization: data.monetization,
        documents: data.documents,
        mainArtist: data.mainArtist,
        originalReleaseDate: data.originalReleaseDate,
        status: release.status === 'APPROVED' ? 'EDITING' : 'PENDING' // Approved releases go to Edits tab, others stay/become Pending
    });

    // Delete old tracks and recreate
    sqlite.deleteTracksByRelease(id);

    for (let i = 0; i < (data.tracks || []).length; i++) {
        const track = data.tracks[i];
        const trackId = `track-${id}-${i}-${Date.now()}`;

        sqlite.createTrack({
            id: trackId,
            releaseId: id,
            title: track.title,
            version: track.version,
            fileUrl: track.fileUrl,

            isrc: track.isrc,
            wisrc: track.wisrc || `WTRK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}${i}`,
            language: track.language,
            isExplicit: track.isExplicit,
            lyrics: track.lyrics,
            aiUsage: track.aiUsage,
            compositionType: track.compositionType,
            trackNumber: i + 1,
            genre: track.genre,
            subGenre: track.subGenre,
            isInstrumental: track.isInstrumental,
            copyrightType: track.copyrightType
        });

        for (let j = 0; j < (track.artists || []).length; j++) {
            const artist = track.artists[j];
            sqlite.createTrackArtist({
                id: `ta-${trackId}-${j}`,
                trackId: trackId,
                name: artist.name,
                role: artist.role,
                legalName: artist.legalName,
                spotifyUrl: artist.spotifyUrl,
                appleId: artist.appleId,
                order: j
            });
        }

        for (let k = 0; k < (track.writers || []).length; k++) {
            const writer = track.writers[k];
            sqlite.createTrackWriter({
                id: `tw-${trackId}-${k}`,
                trackId: trackId,
                name: writer.name,
                legalName: writer.legalName,
                role: writer.role,
                share: writer.share
            });
        }
    }

    sqlite.createLog({ level: 'INFO', message: 'Release Details Updated', details: `Title: ${data.title} (${id})`, userId: req.userId });

    res.json({ success: true });
});

app.put('/api/releases/:id/status', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    const release = sqlite.getReleaseById(id) as any;
    if (!release) {
        return res.status(404).json({ error: 'Release not found' });
    }

    sqlite.updateRelease(id, {
        status: status,
        rejectionReason: reason || null
    });

    sqlite.createLog({ level: 'WARN', message: `Release ${status}`, details: `Release: ${release.title}, Reason: ${reason || 'N/A'}`, userId: req.userId });

    // Create notification
    const notifId = `notif-${Date.now()}`;
    if (status === 'APPROVED') {
        sqlite.createNotification({
            id: notifId,
            userId: release.user_id,
            title: 'Release Approved',
            message: `Your release "${release.title}" is now live!`,
            type: 'success'
        });

        // Auto-sync Social Accounts
        try {
            // Get release details including Spotify/YouTube URLs
            // Assuming release has main artist URLs or we pull from user input stored in release
            // If strictly relying on what's in the DB release record:
            if (release.spotify_url) {
                sqlite.createSocialAccount({
                    id: `social-spotify-${Date.now()}`,
                    userId: release.user_id,
                    platform: 'spotify',
                    url: release.spotify_url,
                    name: release.artist_name
                });
            }
            if (release.youtube_url) {
                sqlite.createSocialAccount({
                    id: `social-youtube-${Date.now()}`,
                    userId: release.user_id,
                    platform: 'youtube',
                    url: release.youtube_url,
                    name: release.artist_name
                });
            }


            // Also check Tracks for Main Artists with Spotify URLs
            const tracks = sqlite.getTracksByRelease(id);
            sqlite.createLog({ level: 'INFO', message: `Syncing socials for release ${id}`, details: `Found ${tracks.length} tracks`, userId: req.userId });

            tracks.forEach((t: any) => {
                const trackArtists = sqlite.getArtistsByTrack(t.id);
                trackArtists.forEach((a: any) => {
                    if ((a.role === 'Main Artist' || a.role === 'Featured Artist')) {
                        const spotifyUrl = a.spotify_url || a.spotifyUrl;
                        if (spotifyUrl) {
                            try {
                                sqlite.createSocialAccount({
                                    id: `social-sa-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                                    userId: release.user_id,
                                    platform: 'spotify',
                                    url: spotifyUrl,
                                    name: a.name
                                });
                                sqlite.createLog({ level: 'SUCCESS', message: `Auto-synced Spotify: ${a.name}`, userId: release.user_id });
                            } catch (err: any) {
                                if (err.message && err.message.includes('UNIQUE')) {
                                    sqlite.createLog({ level: 'INFO', message: `Skipped existing Spotify link: ${a.name}`, userId: release.user_id });
                                } else {
                                    sqlite.createLog({ level: 'WARN', message: `Failed to sync Spotify for ${a.name}`, details: err.message, userId: release.user_id });
                                }
                            }
                        }
                    }
                });
            });

        } catch (e: any) {
            console.error('Failed to auto-sync social accounts', e);
            sqlite.createLog({ level: 'ERROR', message: 'Social Sync Failed', details: e.message, userId: req.userId });
        }

    } else if (status === 'REJECTED') {
        sqlite.createNotification({
            id: notifId,
            userId: release.user_id,
            title: 'Release Rejected',
            message: `Your release "${release.title}" was rejected. Reason: ${reason || 'No reason provided'}`,
            type: 'error'
        });
    }

    res.json({ success: true, newStatus: status });
});

app.put('/api/releases/:id/takedown', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const release = sqlite.getReleaseById(id) as any;

    if (!release) {
        return res.status(404).json({ error: 'Release not found' });
    }

    if (release.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    sqlite.updateRelease(id, {
        status: 'TAKEDOWN',
        takedownRequestedAt: new Date().toISOString()
    });

    res.json({ success: true });
});

app.delete('/api/releases/:id', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;

    // Get release and tracks before deletion to find file paths
    const release = sqlite.getReleaseById(id) as any;
    const tracks = sqlite.getTracksByRelease(id) as any[];

    // Collect all file IDs to delete
    const filesToDelete: string[] = [];

    // Add track audio files
    for (const track of tracks) {
        if (track.file_url && track.file_url.includes('/api/files/')) {
            const fileId = track.file_url.split('/api/files/')[1];
            if (fileId) filesToDelete.push(fileId);
        }
    }

    // Add cover image if it's a local file
    if (release && release.cover_url && release.cover_url.includes('/api/files/')) {
        const fileId = release.cover_url.split('/api/files/')[1];
        if (fileId) filesToDelete.push(fileId);
    }

    // Delete files from disk
    for (const fileId of filesToDelete) {
        const file = sqlite.getFileById(fileId) as any;
        if (file && file.path) {
            const filePath = path.join(UPLOADS_DIR, file.path);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[Cleanup] Deleted file: ${filePath}`);
                }
            } catch (err) {
                console.error(`[Cleanup] Failed to delete file: ${filePath}`, err);
            }
        }
        // Also delete file record from database
        sqlite.db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
    }

    // Delete database records
    sqlite.deleteTracksByRelease(id);
    sqlite.db.prepare('DELETE FROM releases WHERE id = ?').run(id);

    console.log(`[Admin] Deleted release ${id} and ${filesToDelete.length} associated files`);
    res.json({ success: true, filesDeleted: filesToDelete.length });
});

// ==================== NOTIFICATIONS ====================

app.get('/api/notifications', authMiddleware, (req: any, res) => {
    const notifications = sqlite.getNotificationsByUser(req.userId) as any[];
    res.json({
        notifications: notifications.map(n => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type,
            read: !!n.read,
            createdAt: n.created_at
        }))
    });
});

app.put('/api/notifications/read', authMiddleware, (req: any, res) => {
    sqlite.markNotificationsRead(req.userId);
    res.json({ success: true });
});

// ==================== ARTISTS LIBRARY ====================

app.get('/api/artists', authMiddleware, (req: any, res) => {
    const artists = sqlite.getArtistLibrary(req.userId) as any[];
    res.json({
        artists: artists.map(a => ({
            id: a.id,
            name: a.name,
            legalName: a.legal_name,
            spotifyUrl: a.spotify_url,
            appleId: a.apple_id,
            instagramUrl: a.instagram_url
        }))
    });
});

app.post('/api/artists', authMiddleware, (req: any, res) => {
    const { name, legalName, spotifyUrl, appleUrl, instagramUrl } = req.body;

    const artistId = `artist-${Date.now()}`;
    sqlite.createArtist({
        id: artistId,
        userId: req.userId,
        name,
        legalName,
        spotifyUrl,
        appleId: appleUrl,
        instagramUrl
    });

    // Auto-create Social Account for Analytics
    if (spotifyUrl) {
        try {
            // Check if already exists to avoid unique constraint error?
            // sqlite.createSocialAccount usually handles or we catch error
            sqlite.createSocialAccount({
                id: `social-sa-${Date.now()}`,
                userId: req.userId,
                platform: 'spotify',
                url: spotifyUrl,
                name: name
            });
        } catch (e: any) {
            console.log('Skipping auto-create social account (might exist):', e.message);
        }
    }

    res.json({ success: true, artist: { id: artistId, name, legalName } });
});

// ==================== WITHDRAWALS ====================

app.get('/api/withdrawals', authMiddleware, (req: any, res) => {
    const user = sqlite.getUserById(req.userId) as any;
    let withdrawals: any[];

    if (user.role === 'admin') {
        withdrawals = sqlite.getAllWithdrawals() as any[];
    } else {
        withdrawals = sqlite.getWithdrawalsByUser(req.userId) as any[];
    }

    res.json({
        withdrawals: withdrawals.map(w => ({
            id: w.id,
            userId: w.user_id,
            amount: w.amount,
            method: w.method,
            details: w.details,
            status: w.status,
            note: w.note,
            requestedAt: w.requested_at
        }))
    });
});

app.post('/api/withdrawals', authMiddleware, (req: any, res) => {
    const { amount, method, details } = req.body;

    const withdrawalId = `wd-${Date.now()}`;
    sqlite.createWithdrawal({
        id: withdrawalId,
        userId: req.userId,
        amount,
        method,
        details,
        status: 'PENDING'
    });

    sqlite.createLog({ level: 'INFO', message: 'Withdrawal Requested', details: `Amount: ${amount} ${method}`, userId: req.userId });

    res.json({ success: true, withdrawalId });
});

app.put('/api/admin/withdrawals/:id', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { status, note } = req.body;

    sqlite.updateWithdrawal(id, { status, note });
    sqlite.createLog({ level: 'INFO', message: 'Withdrawal Status Updated', details: `ID: ${id}, Status: ${status}`, userId: req.userId });
    res.json({ success: true });
});

// ==================== EARNINGS ====================

app.get('/api/earnings', authMiddleware, (req: any, res) => {
    const earnings = sqlite.getEarningsByUser(req.userId) as any[];
    res.json({
        earnings: earnings.map(e => ({
            id: e.id,
            userId: e.user_id,
            month: e.month,
            amount: e.amount,
            streams: e.streams,
            downloads: e.downloads
        }))
    });
});

app.get('/api/admin/earnings', authMiddleware, adminMiddleware, (req, res) => {
    const earnings = sqlite.getAllEarnings() as any[];
    res.json({
        earnings: earnings.map(e => ({
            id: e.id,
            userId: e.user_id,
            month: e.month,
            amount: e.amount,
            streams: e.streams,
            downloads: e.downloads
        }))
    });
});

app.post('/api/admin/earnings', authMiddleware, adminMiddleware, (req: any, res) => {
    const { userId, month, amount, streams, downloads } = req.body;

    const earningId = `earning-${Date.now()}`;
    sqlite.createEarning({
        id: earningId,
        userId,
        month,
        amount,
        streams,
        downloads
    });

    sqlite.createLog({ level: 'SUCCESS', message: 'Earning Added', details: `User: ${userId}, Amount: ${amount}`, userId: req.userId });

    res.json({ success: true });
});

app.delete('/api/admin/earnings/:id', authMiddleware, adminMiddleware, (req, res) => {
    sqlite.deleteEarning(req.params.id);
    res.json({ success: true });
});

// ==================== ADMIN ====================

app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
    const users = sqlite.all('SELECT * FROM users ORDER BY created_at DESC') as any[];
    res.json({
        users: users.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            artistName: u.artist_name,
            role: u.role,
            isBanned: !!u.is_banned,
            banReason: u.ban_reason,
            applicationStatus: u.application_status,
            balance: u.balance,
            createdAt: u.created_at
        }))
    });
});

app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const updates = req.body;

    const sqlUpdates: { [key: string]: any } = {};
    if (updates.balance !== undefined) sqlUpdates.balance = updates.balance;
    if (updates.artistName !== undefined) sqlUpdates.artist_name = updates.artistName;
    if (updates.role !== undefined) sqlUpdates.role = updates.role;
    if (updates.applicationStatus !== undefined) sqlUpdates.application_status = updates.applicationStatus;
    if (updates.spotifyUrl !== undefined) sqlUpdates.spotify_url = updates.spotifyUrl;
    if (updates.youtubeUrl !== undefined) sqlUpdates.youtube_url = updates.youtubeUrl;

    if (Object.keys(sqlUpdates).length > 0) {
        const fields = Object.keys(sqlUpdates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(sqlUpdates);
        sqlite.db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values, id);
    }

    sqlite.createLog({ level: 'INFO', message: 'User Updated', details: `ID: ${id}`, userId: req.userId });

    res.json({ success: true });
});

app.get('/api/admin/users/:id', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const user = sqlite.getUserById(id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password: _, ...userData } = user;

    const profile = {
        bio: user.bio,
        instagramUrl: user.instagram_url,
        spotifyUrl: user.spotify_url,
        soundcloudUrl: user.soundcloud_url,
        youtubeUrl: user.youtube_url,
        twitterUrl: user.twitter_url,
        websiteUrl: user.website_url,
        profilePicture: user.profile_picture
    };

    const tickets = sqlite.getTicketsByUser(id);
    const paymentMethods = sqlite.getPaymentMethods(id);
    const socialAccounts = sqlite.getSocialAccountsByUser(id);

    res.json({
        user: {
            ...userData,
            firstName: user.first_name,
            lastName: user.last_name,
            artistName: user.artist_name,
            role: user.role,
            isBanned: !!user.is_banned,
            banReason: user.ban_reason,
            applicationStatus: user.application_status,
            balance: user.balance,
            createdAt: user.created_at
        },
        profile,
        tickets,
        paymentMethods,
        socialAccounts
    });
});

app.put('/api/admin/users/:id/ban', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    sqlite.db.prepare('UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?').run(reason, id);
    sqlite.createLog({ level: 'WARN', message: 'User Banned', details: `ID: ${id}, Reason: ${reason}`, userId: req.userId });
    res.json({ success: true });
});

app.put('/api/admin/users/:id/unban', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    sqlite.db.prepare('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?').run(id);
    sqlite.createLog({ level: 'WARN', message: 'User Unbanned', details: `ID: ${id}`, userId: req.userId });
    res.json({ success: true });
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
    const stats = sqlite.getStats();
    res.json({ stats });
});

// ==================== APPLICATIONS ====================

app.get('/api/admin/applications', authMiddleware, adminMiddleware, (req, res) => {
    const applications = sqlite.getPendingApplications() as any[];
    res.json({
        applications: applications.map(a => ({
            id: a.id,
            userId: a.user_id,
            bio: a.bio,
            instagramUrl: a.instagram_url,
            spotifyUrl: a.spotify_url,
            soundcloudUrl: a.soundcloud_url,
            demoTrackUrl: a.demo_track_url,
            status: a.status,
            submittedAt: a.submitted_at,
            user: {
                email: a.email,
                firstName: a.first_name,
                lastName: a.last_name,
                artistName: a.artist_name
            }
        }))
    });
});

app.post('/api/applications', authMiddleware, (req: any, res) => {
    const { bio, instagramUrl, spotifyUrl, soundcloudUrl, demoTrackUrl } = req.body;

    const existing = sqlite.getApplicationByUser(req.userId);
    if (existing) {
        return res.status(400).json({ error: 'Application already exists' });
    }

    const appId = `app-${Date.now()}`;
    sqlite.createApplication({
        id: appId,
        userId: req.userId,
        bio,
        instagramUrl,
        spotifyUrl,
        soundcloudUrl,
        demoTrackUrl,
        status: 'PENDING'
    });

    sqlite.db.prepare("UPDATE users SET application_status = 'PENDING' WHERE id = ?").run(req.userId);
    sqlite.createLog({ level: 'INFO', message: 'New Application', details: 'User applied for artist account', userId: req.userId });

    res.json({ success: true });
});

app.put('/api/admin/applications/:userId', authMiddleware, adminMiddleware, (req: any, res) => {
    const { userId } = req.params;
    const { approved } = req.body;

    const status = approved ? 'APPROVED' : 'REJECTED';
    sqlite.db.prepare('UPDATE applications SET status = ? WHERE user_id = ?').run(status, userId);
    sqlite.db.prepare('UPDATE users SET application_status = ? WHERE id = ?').run(status, userId);

    const notifId = `notif-${Date.now()}`;
    sqlite.createNotification({
        id: notifId,
        userId: userId,
        title: approved ? 'Application Approved!' : 'Application Rejected',
        message: approved
            ? 'Welcome to WBBT Records! You can now submit releases.'
            : 'Your application was not approved at this time.',
        type: approved ? 'success' : 'error'
    });



    sqlite.createLog({ level: 'INFO', message: 'Application Reviewed', details: `User: ${userId}, Status: ${status}`, userId: req.userId });

    res.json({ success: true });
});

// ==================== SUPPORT TICKETS ====================

app.get('/api/tickets', authMiddleware, (req: any, res) => {
    const user = sqlite.getUserById(req.userId) as any;
    let tickets: any[];

    if (user.role === 'admin') {
        tickets = sqlite.getAllTickets() as any[];
    } else {
        tickets = sqlite.getTicketsByUser(req.userId) as any[];
    }

    const ticketsWithResponses = tickets.map((t: any) => {
        const responses = sqlite.getTicketResponses(t.id) as any[];
        return {
            id: t.id,
            userId: t.user_id,
            subject: t.subject,
            message: t.message,
            status: t.status,
            createdAt: t.created_at,
            responses: responses.map(r => ({
                id: r.id,
                userId: r.user_id,
                message: r.message,
                isAdmin: !!r.is_admin,
                createdAt: r.created_at
            }))
        };
    });

    res.json({ tickets: ticketsWithResponses });
});

app.post('/api/tickets', authMiddleware, (req: any, res) => {
    const { subject, message } = req.body;

    const ticketId = `ticket-${Date.now()}`;
    sqlite.createTicket({
        id: ticketId,
        userId: req.userId,
        subject,
        message,
        status: 'OPEN'
    });

    res.json({ success: true, ticketId });
});

app.post('/api/tickets/:id/respond', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { message } = req.body;

    const user = sqlite.getUserById(req.userId) as any;
    const responseId = `resp-${Date.now()}`;

    sqlite.createTicketResponse({
        id: responseId,
        ticketId: id,
        userId: req.userId,
        message,
        isAdmin: user.role === 'admin'
    });

    res.json({ success: true });
});

app.put('/api/tickets/:id/status', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    sqlite.db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    const stats = sqlite.getStats();
    res.json({
        status: 'ok',
        database: 'SQLite',
        ...stats
    });
});

// ==================== PAYMENT METHODS ====================

app.get('/api/payment-methods', authMiddleware, (req: any, res) => {
    const methods = sqlite.getPaymentMethods(req.userId) as any[];
    res.json({
        paymentMethods: methods.map(m => ({
            id: m.id,
            type: m.type,
            bankName: m.bank_name,
            accountHolder: m.account_holder,
            iban: m.iban,
            swiftBic: m.swift_bic,
            isDefault: !!m.is_default,
            createdAt: m.created_at
        }))
    });
});

app.post('/api/payment-methods', authMiddleware, (req: any, res) => {
    const { bankName, accountHolder, iban, swiftBic, isDefault } = req.body;

    const methodId = `pm-${Date.now()}`;
    sqlite.createPaymentMethod({
        id: methodId,
        userId: req.userId,
        type: 'IBAN',
        bankName,
        accountHolder,
        iban,
        swiftBic,
        isDefault: isDefault || false
    });

    res.json({ success: true, methodId });
});

app.put('/api/payment-methods/:id/default', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    sqlite.setDefaultPaymentMethod(req.userId, id);
    res.json({ success: true });
});

app.delete('/api/payment-methods/:id', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    sqlite.deletePaymentMethod(id);
    res.json({ success: true });
});


// ==================== WITHDRAWALS ====================

app.get('/api/withdrawals', authMiddleware, (req: any, res) => {
    const withdrawals = sqlite.getWithdrawalsByUser(req.userId);
    res.json({ withdrawals });
});

app.post('/api/withdrawals', authMiddleware, (req: any, res) => {
    const { amount, method, details } = req.body;
    const id = crypto.randomUUID();

    try {
        sqlite.createWithdrawal({
            id,
            userId: req.userId,
            amount,
            method,
            details,
            status: 'PENDING'
        });
        res.json({ success: true, id });
    } catch (error: any) {
        if (error.message === 'Insufficient balance') {
            res.status(400).json({ error: 'Insufficient balance' });
        } else {
            res.status(500).json({ error: 'Failed to create withdrawal' });
        }
    }
});

app.get('/api/admin/withdrawals', authMiddleware, (req: any, res) => {
    const withdrawals = sqlite.getAllWithdrawals();
    res.json({
        withdrawals: withdrawals.map((w: any) => ({
            id: w.id,
            userId: w.user_id,
            artistName: w.artistName,
            email: w.email,
            amount: w.amount,
            method: w.method,
            details: w.details,
            status: w.status,
            note: w.note,
            requestedAt: w.requested_at,
            processedAt: w.processed_at
        }))
    });
});

app.put('/api/admin/withdrawals/:id', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { status, note } = req.body;
    try {
        sqlite.updateWithdrawalStatus(id, status, note);
        res.json({ success: true });
    } catch (e) {
        console.error('Update withdrawal failed', e);
        res.status(500).json({ error: 'Failed to update' });
    }
});

// ==================== TEAMS ====================

app.get('/api/teams', authMiddleware, (req: any, res) => {
    const ownedTeams = sqlite.getTeamsByOwner(req.userId) as any[];
    const memberTeams = sqlite.getUserTeams(req.userId) as any[];

    const formatTeam = (t: any, isOwner: boolean) => {
        const members = sqlite.getTeamMembers(t.id) as any[];
        const invites = sqlite.getTeamInvites(t.id) as any[];
        return {
            id: t.id,
            name: t.name,
            isOwner,
            sharePercentage: t.share_percentage || 100,
            members: members.map(m => ({
                id: m.id,
                userId: m.user_id,
                email: m.email,
                artistName: m.artist_name,
                sharePercentage: m.share_percentage,
                role: m.role,
                status: m.status
            })),
            invites: isOwner ? invites.map(i => ({
                id: i.id,
                email: i.email,
                sharePercentage: i.share_percentage,
                status: i.status,
                inviteCode: i.invite_code
            })) : [],
            createdAt: t.created_at
        };
    };

    res.json({
        ownedTeams: ownedTeams.map(t => formatTeam(t, true)),
        memberTeams: memberTeams.map(t => formatTeam(t, false))
    });
});

app.post('/api/teams', authMiddleware, (req: any, res) => {
    const { name } = req.body;

    const teamId = `team-${Date.now()}`;
    sqlite.createTeam({
        id: teamId,
        ownerId: req.userId,
        name
    });

    // Add owner as member with 100%
    sqlite.addTeamMember({
        id: `tm-${teamId}-owner`,
        teamId,
        userId: req.userId,
        sharePercentage: 100,
        role: 'owner',
        status: 'ACTIVE'
    });

    res.json({ success: true, teamId });
});

app.delete('/api/teams/:id', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const team = sqlite.getTeamById(id) as any;

    if (!team || team.owner_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    sqlite.deleteTeam(id);
    res.json({ success: true });
});

// ==================== TICKETS ====================

app.get('/api/tickets', authMiddleware, (req: any, res) => {
    const tickets = sqlite.getTicketsByUser(req.userId);
    res.json({ tickets });
});

app.get('/api/admin/tickets', authMiddleware, adminMiddleware, (req: any, res) => {
    const tickets = sqlite.getAllTickets();
    res.json({ tickets });
});

app.post('/api/tickets', authMiddleware, (req: any, res) => {
    const { subject, message, attachments } = req.body;
    const ticketId = `ticket-${Date.now()}`;
    const user = sqlite.getUserById(req.userId) as any;

    sqlite.createTicket({
        id: ticketId,
        userId: req.userId,
        userEmail: user.email,
        subject,
        message,
        attachments,
        status: 'OPEN'
    });
    res.json({ success: true, ticketId });
});

app.get('/api/tickets/:id/responses', authMiddleware, (req: any, res) => {
    const responses = sqlite.getTicketResponses(req.params.id);
    res.json({ responses });
});

app.post('/api/tickets/:id/reply', authMiddleware, (req: any, res) => {
    const { message } = req.body;
    const { id } = req.params;

    // Check if closed
    const ticket = sqlite.db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (ticket && ticket.is_closed) {
        return res.status(403).json({ error: 'Ticket is closed' });
    }

    sqlite.createTicketResponse({
        id: `resp-${Date.now()}`,
        ticketId: id,
        userId: req.userId,
        message,
        isAdmin: false
    });
    res.json({ success: true });
});

app.post('/api/admin/tickets/:id/reply', authMiddleware, adminMiddleware, (req: any, res) => {
    const { message } = req.body;
    const { id } = req.params;

    sqlite.createTicketResponse({
        id: `resp-${Date.now()}`,
        ticketId: id,
        userId: req.userId, // Admin ID
        message,
        isAdmin: true
    });

    // Auto-update status to IN_PROGRESS if OPEN
    sqlite.db.prepare("UPDATE tickets SET status = 'IN_PROGRESS' WHERE id = ? AND status = 'OPEN'").run(id);

    res.json({ success: true });
});

app.put('/api/admin/tickets/:id/close', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    sqlite.closeTicket(id);
    res.json({ success: true });
});

app.put('/api/admin/tickets/:id/toggle-upload', authMiddleware, adminMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { allow } = req.body;
    sqlite.db.prepare('UPDATE tickets SET allow_uploads = ? WHERE id = ?').run(allow ? 1 : 0, id);
    res.json({ success: true });
});

app.post('/api/tickets/:id/upload', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { fileUrl, fileName } = req.body;

    const ticket = sqlite.db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // If not admin and uploads not allowed
    const user = sqlite.getUserById(req.userId) as any;
    if (user.role !== 'admin' && !ticket.allow_uploads) {
        return res.status(403).json({ error: 'Uploads not enabled for this ticket' });
    }

    const currentAttachments = JSON.parse(ticket.attachments || '[]');
    currentAttachments.push({ url: fileUrl, name: fileName, uploadedAt: new Date().toISOString(), uploader: user.email });

    sqlite.db.prepare('UPDATE tickets SET attachments = ? WHERE id = ?').run(JSON.stringify(currentAttachments), id);

    res.json({ success: true });
});

app.post('/api/admin/system/optimize', authMiddleware, adminMiddleware, (req: any, res) => {
    try {
        const result = sqlite.optimize();
        res.json(result);
    } catch (error: any) {
        console.error('Optimization failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Backup System Imports
import { createBackup, restoreBackup } from './backup';
import multer from 'multer';

// Multer for restore upload
const restoreUpload = multer({ dest: path.join(__dirname, 'temp_restore') });

app.get('/api/admin/system/backup', authMiddleware, adminMiddleware, (req, res) => {
    try {
        createBackup(res);
    } catch (error) {
        console.error('Backup failed:', error);
        res.status(500).send('Backup failed');
    }
});

app.post('/api/admin/system/restore', authMiddleware, adminMiddleware, restoreUpload.single('backup'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No backup file uploaded' });

    try {
        await restoreBackup(req.file.path);
        // Clean up temp file
        fs.unlinkSync(req.file.path);
        res.json({ success: true, message: 'System restored successfully' });
    } catch (error: any) {
        console.error('Restore failed:', error);
        res.status(500).json({ error: 'Restore failed: ' + error.message });
    }
});

// Get comprehensive user details for Admin
app.get('/api/admin/users/:userId/details', authMiddleware, adminMiddleware, (req: any, res) => {
    const { userId } = req.params;
    console.log(`[Backend-Debug] HIT details route for ${userId}`);

    try {
        const user = sqlite.getUserById(userId) as any;
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Remove sensitive data
        delete user.password;

        const profile = sqlite.getUserProfile(userId);
        const paymentMethods = sqlite.getPaymentMethodsByUser(userId);
        const tickets = sqlite.getTicketsByUser(userId);

        res.json({
            user,
            profile,
            paymentMethods,
            tickets
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

app.get('/api/admin/system-logs', authMiddleware, adminMiddleware, (req, res) => {
    const logs = sqlite.getLogs(100);
    res.json(logs);
});

// Team Invites
app.post('/api/teams/:id/invite', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const { email, sharePercentage } = req.body;

    const team = sqlite.getTeamById(id) as any;
    if (!team || team.owner_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    const inviteCode = Math.random().toString(36).substr(2, 12).toUpperCase();
    const inviteId = `inv-${Date.now()}`;

    sqlite.createTeamInvite({
        id: inviteId,
        teamId: id,
        email,
        sharePercentage: sharePercentage || 0,
        inviteCode
    });

    // Create notification if user exists
    const invitedUser = sqlite.getUserByEmail(email) as any;
    if (invitedUser) {
        sqlite.createNotification({
            id: `notif-${Date.now()}`,
            userId: invitedUser.id,
            title: 'Team Invite',
            message: `You've been invited to join team "${team.name}"`,
            type: 'info'
        });
    }

    res.json({ success: true, inviteCode });
});

app.post('/api/teams/accept-invite', authMiddleware, (req: any, res) => {
    const { inviteCode } = req.body;

    const invite = sqlite.getInviteByCode(inviteCode) as any;
    if (!invite || invite.status !== 'PENDING') {
        return res.status(400).json({ error: 'Invalid or expired invite' });
    }

    // Add user to team
    sqlite.addTeamMember({
        id: `tm-${invite.team_id}-${req.userId}`,
        teamId: invite.team_id,
        userId: req.userId,
        sharePercentage: invite.share_percentage,
        role: 'member',
        status: 'ACTIVE'
    });

    sqlite.updateTeamInvite(invite.id, 'ACCEPTED');

    res.json({ success: true });
});

app.put('/api/teams/:teamId/members/:userId', authMiddleware, (req: any, res) => {
    const { teamId, userId } = req.params;
    const { sharePercentage } = req.body;

    const team = sqlite.getTeamById(teamId) as any;
    if (!team || team.owner_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    sqlite.db.prepare('UPDATE team_members SET share_percentage = ? WHERE team_id = ? AND user_id = ?')
        .run(sharePercentage, teamId, userId);

    res.json({ success: true });
});

app.delete('/api/teams/:teamId/members/:userId', authMiddleware, (req: any, res) => {
    const { teamId, userId } = req.params;

    const team = sqlite.getTeamById(teamId) as any;
    if (!team || team.owner_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    sqlite.removeTeamMember(teamId, userId);
    res.json({ success: true });
});

// ==================== CONTRACTS ====================

app.get('/api/contracts', authMiddleware, (req: any, res) => {
    const contracts = sqlite.getContractsByUser(req.userId) as any[];
    res.json({
        contracts: contracts.map(c => ({
            id: c.id,
            releaseId: c.release_id,
            type: c.type,
            terms: c.terms,
            status: c.status,
            signedAt: c.signed_at,
            createdAt: c.created_at
        }))
    });
});

app.post('/api/contracts', authMiddleware, (req: any, res) => {
    const { releaseId, type, terms } = req.body;

    const contractId = `contract-${Date.now()}`;
    sqlite.createContract({
        id: contractId,
        userId: req.userId,
        releaseId,
        type: type || 'distribution',
        terms,
        status: 'PENDING'
    });

    res.json({ success: true, contractId });
});

app.put('/api/contracts/:id/sign', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    sqlite.signContract(id, ipAddress);

    res.json({ success: true, signedAt: new Date().toISOString() });
});

// ==================== USER PROFILE ====================

app.get('/api/profile', authMiddleware, (req: any, res) => {
    const user = sqlite.getUserById(req.userId) as any;
    const profile = sqlite.getUserProfile(req.userId) as any;

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            artistName: user.artist_name,
            balance: user.balance,
            applicationStatus: user.application_status
        },
        profile: profile ? {
            profilePicture: profile.profile_picture,
            bio: profile.bio,
            instagramUrl: profile.instagram_url,
            spotifyUrl: profile.spotify_url,
            soundcloudUrl: profile.soundcloud_url,
            youtubeUrl: profile.youtube_url,
            twitterUrl: profile.twitter_url,
            websiteUrl: profile.website_url
        } : null
    });
});

app.put('/api/profile', authMiddleware, (req: any, res) => {
    const { firstName, lastName, artistName, email, currentPassword, newPassword,
        profilePicture, bio, instagramUrl, spotifyUrl, soundcloudUrl, youtubeUrl, twitterUrl, websiteUrl } = req.body;

    const user = sqlite.getUserById(req.userId) as any;

    // Update basic user info
    const userUpdates: any = {};
    if (firstName) userUpdates.first_name = firstName;
    if (lastName) userUpdates.last_name = lastName;
    if (artistName) userUpdates.artist_name = artistName;
    if (email && email !== user.email) {
        // Check if email already exists
        const existing = sqlite.getUserByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        userUpdates.email = email;
    }

    // Password change
    if (newPassword) {
        if (!currentPassword || !bcrypt.compareSync(currentPassword, user.password)) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        userUpdates.password = bcrypt.hashSync(newPassword, 10);
    }

    if (Object.keys(userUpdates).length > 0) {
        const fields = Object.keys(userUpdates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(userUpdates);
        sqlite.db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values, req.userId);
    }

    // Update profile
    sqlite.upsertUserProfile({
        userId: req.userId,
        profilePicture,
        bio,
        instagramUrl,
        spotifyUrl,
        soundcloudUrl,
        youtubeUrl,
        twitterUrl,
        websiteUrl
    });

    res.json({ success: true });
});

// ==================== ANALYTICS (Manual Import) ====================

app.get('/api/analytics', authMiddleware, (req: any, res) => {
    // Get earnings as analytics source
    const earnings = sqlite.getEarningsByUser(req.userId) as any[];
    const releases = sqlite.getReleasesByUser(req.userId) as any[];

    const totalStreams = earnings.reduce((sum, e) => sum + (e.streams || 0), 0);
    const totalEarnings = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);

    res.json({
        overview: {
            totalStreams,
            totalEarnings,
            totalReleases: releases.length,
            approvedReleases: releases.filter((r: any) => r.status === 'APPROVED').length
        },
        monthlyData: earnings.map(e => ({
            month: e.month,
            streams: e.streams,
            downloads: e.downloads,
            earnings: e.amount
        })),
        releases: releases.map((r: any) => ({
            id: r.id,
            title: r.title,
            status: r.status,
            createdAt: r.created_at
        }))
    });
});

// ==================== FILES ====================

app.get('/api/files/:id', (req, res) => {
    const { id } = req.params;
    const filePath = path.join(UPLOADS_DIR, id);

    // Prevent directory traversal
    if (!filePath.startsWith(UPLOADS_DIR)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
});

app.post('/api/upload', authMiddleware, (req: any, res) => {
    try {
        const { filename, data } = req.body;
        if (!data || !filename) {
            return res.status(400).json({ error: 'Missing file data' });
        }

        // Handle base64 data
        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid file data' });
        }

        const buffer = Buffer.from(matches[2], 'base64');
        const ext = path.extname(filename);
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        const filePath = path.join(UPLOADS_DIR, fileId);

        fs.writeFileSync(filePath, buffer);
        res.json({ success: true, fileId });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.post('/api/releases/:id/approve-takedown', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;

    sqlite.updateRelease(id, { status: 'TAKEDOWN_APPROVED' });

    // Create notification
    const release = sqlite.getReleaseById(id) as any;
    if (release) {
        const notifId = `notif-${Date.now()}`;
        sqlite.createNotification({
            id: notifId,
            userId: release.user_id,
            title: 'Takedown Approved',
            message: `Your takedown request for "${release.title}" has been approved.`,
            type: 'success'
        });
    }

    res.json({ success: true });
});


// ==================== ADMIN USER MGMT ====================

app.get('/api/admin/users/:id/details', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;
    const user = sqlite.getUserById(id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = sqlite.getUserProfile(id);
    const releases = sqlite.getReleasesByUser(id);
    const earnings = sqlite.getEarningsByUser(id);
    const withdrawals = sqlite.getWithdrawalsByUser(id);
    const tickets = sqlite.db.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC').all(id);
    const paymentMethods = sqlite.getPaymentMethodsByUser(id);

    res.json({
        user,
        profile,
        releases,
        earnings,
        withdrawals,
        tickets,
        paymentMethods
    });
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;
    try {
        sqlite.deleteUser(id);
        res.json({ success: true });
    } catch (e) {
        console.error('Delete user failed', e);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.put('/api/admin/users/:id/password', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        sqlite.updateUser(id, { password: hashedPassword });
        res.json({ success: true });
    } catch (e) {
        console.error('Password reset failed', e);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const stats = sqlite.getStats();
        res.json({ stats });
    } catch (e) {
        console.error('Stats error:', e);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.put('/api/admin/users/:id/ban', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // Update user status
    sqlite.updateUser(id, { is_banned: 1, ban_reason: reason });

    // Add IP ban
    try {
        sqlite.db.prepare('INSERT OR IGNORE INTO ip_bans (ip_address, reason) VALUES (?, ?)').run(ip, reason);
    } catch (e) {
        console.error('Failed to ban IP', e);
    }

    res.json({ success: true });
});

app.put('/api/admin/users/:id/unban', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;

    sqlite.updateUser(id, { is_banned: 0, ban_reason: null });
    // Optional: Remove IP ban? Maybe keep it for safety, or remove manually. 
    // For now we just unban the user account.

    res.json({ success: true });
});

app.put('/api/admin/applications/:userId', authMiddleware, adminMiddleware, (req, res) => {
    const { userId } = req.params;
    const { approved, reason } = req.body;

    if (approved) {
        sqlite.updateUser(userId, { applicationStatus: 'APPROVED', is_banned: 0, ban_reason: null });
        sqlite.updateApplication(userId, 'APPROVED');

        // Notify
        sqlite.createNotification({
            id: `notif-${Date.now()}`,
            userId,
            title: 'Application Approved',
            message: 'Your artist application has been approved! You can now release music.',
            type: 'success'
        });
    } else {
        sqlite.updateUser(userId, {
            applicationStatus: 'REJECTED',
            ban_reason: reason // Store rejection reason in ban_reason for visibility in restricted mode if we want to block them logic
        });
        sqlite.updateApplication(userId, 'REJECTED');

        // Notify
        sqlite.createNotification({
            id: `notif-${Date.now()}`,
            userId,
            title: 'Application Rejected',
            message: reason ? `Reason: ${reason}` : 'Your application was declined.',
            type: 'error'
        });
    }
    res.json({ success: true });
});

// ==================== CLAIMS ROUTES ====================

// Create a new claim (Spotify or YouTube)
app.post('/api/claims', authMiddleware, restrictedMiddleware, (req: any, res) => {
    const { type, email, artistId, artistName, artistLink, channelUrl } = req.body;

    if (!type || !email) {
        return res.status(400).json({ error: 'Type and email are required' });
    }

    if (type === 'youtube' && !channelUrl) {
        return res.status(400).json({ error: 'Channel URL is required for YouTube claims' });
    }

    const claim = {
        id: `claim-${Date.now()}`,
        userId: req.userId,
        type,
        email,
        artistId,
        artistName,
        artistLink,
        channelUrl,
        status: 'PENDING'
    };

    sqlite.createClaim(claim);
    res.json({ success: true, claim });
});

// Get user's claims
app.get('/api/claims', authMiddleware, restrictedMiddleware, (req: any, res) => {
    const claims = sqlite.getClaimsByUser(req.userId);
    res.json({ claims });
});

// Admin: Get all claims
app.get('/api/admin/claims', authMiddleware, adminMiddleware, (req, res) => {
    const claims = sqlite.getAllClaims();
    res.json({ claims });
});

// Admin: Update claim status (approve/reject)
app.put('/api/admin/claims/:id', authMiddleware, adminMiddleware, (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    sqlite.updateClaimStatus(id, status, reason);

    // Get claim to notify user
    const claim = sqlite.db.prepare('SELECT * FROM claims WHERE id = ?').get(id) as any;
    if (claim) {
        const typeLabel = claim.type === 'spotify' ? 'Spotify for Artists' : 'YouTube Official Artist Channel';
        if (status === 'APPROVED') {
            sqlite.createNotification({
                id: `notif-${Date.now()}`,
                userId: claim.user_id,
                title: `${typeLabel} Claim Approved`,
                message: `Your ${typeLabel} claim has been approved! Your profile will be updated shortly.`,
                type: 'success'
            });
        } else if (status === 'REJECTED') {
            sqlite.createNotification({
                id: `notif-${Date.now()}`,
                userId: claim.user_id,
                title: `${typeLabel} Claim Rejected`,
                message: reason ? `Your claim was rejected. Reason: ${reason}` : 'Your claim was rejected.',
                type: 'error'
            });
        }
    }

    res.json({ success: true });
});

// ==================== STATIC FILES (PRODUCTION) ====================
// Serve static files from the 'dist' directory
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    console.log('📂 Serving static files from dist');
    app.use(express.static(distPath));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
}

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`\n🚀 WBBT Records Server (SQLite) running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    const stats = sqlite.getStats();
    console.log(`📈 Stats: ${stats.totalUsers} users, ${stats.totalReleases} releases`);
});

