const API_BASE = '/api'; // Always relative to current origin (proxied)

const setToken = (token: string, remember: boolean = true) => {
    if (remember) {
        localStorage.setItem('wbbt_token', token);
    } else {
        sessionStorage.setItem('wbbt_token', token);
    }
};

const getToken = () => localStorage.getItem('wbbt_token') || sessionStorage.getItem('wbbt_token');

const clearToken = () => {
    localStorage.removeItem('wbbt_token');
    sessionStorage.removeItem('wbbt_token');
};

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

export const apiService = {
    // Artists (Library)
    async createArtist(artist: any) {
        const res = await fetch(`${API_BASE}/artists`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(artist)
        });
        if (!res.ok) throw new Error('Failed to create artist');
        return await res.json();
    },

    async getArtistLibrary(userId: string) {
        // Assuming backend filters by user or returns global library
        const res = await fetch(`${API_BASE}/artists`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to fetch artists');
        const data = await res.json();
        return data.artists || [];
    },

    // Writers (Library)
    async createWriter(writer: any) {
        const res = await fetch(`${API_BASE}/writers`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(writer)
        });
        if (!res.ok) throw new Error('Failed to create writer');
        return await res.json();
    },

    async getWriterLibrary(userId: string) {
        const res = await fetch(`${API_BASE}/writers`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to fetch writers');
        const data = await res.json();
        return data.writers || [];
    },

    // Auth
    async login(email: string, password: string, rememberMe: boolean = true) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Login failed');
        }

        const data = await res.json();
        setToken(data.token, rememberMe);
        return data.user;
    },

    async signup(email: string, password: string, firstName: string, lastName: string, artistName: string) {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName, artistName })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Signup failed');
        }

        const data = await res.json();
        setToken(data.token, true); // Signup implies login, default to remember me or session? detailed logic can be added. 
        // For now default to long session (remember=true) for better UX on signup.
        return data.user;
    },

    async getCurrentUser() {
        const token = getToken();
        if (!token) return null;

        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: authHeaders()
            });

            if (!res.ok) {
                clearToken();
                return null;
            }

            const data = await res.json();
            return data.user;
        } catch {
            return null;
        }
    },

    logout() {
        clearToken();
    },





    // Applications
    async submitApplication(userId: string, data: { bio: string; instagramUrl?: string; spotifyUrl?: string; soundcloudUrl?: string; demoTrackUrl: string }) {
        const res = await fetch(`${API_BASE}/applications`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Application submission failed');
        }

        return await res.json();
    },

    // Releases
    async getReleases(userId?: string) {
        const res = await fetch(`${API_BASE}/releases`, {
            headers: authHeaders()
        });

        if (!res.ok) {
            throw new Error('Failed to fetch releases');
        }

        const data = await res.json();
        return data.releases;
    },

    async getReleaseById(id: string) {
        const res = await fetch(`${API_BASE}/releases/${id}`, {
            headers: authHeaders()
        });

        if (!res.ok) {
            throw new Error('Failed to fetch release');
        }

        return await res.json();
    },

    async getTracksByRelease(releaseId: string) {
        const res = await fetch(`${API_BASE}/releases/${releaseId}`, {
            headers: authHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.tracks || [];
    },

    async createRelease(release: any) {
        const res = await fetch(`${API_BASE}/releases`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(release)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create release');
        }

        return await res.json();
    },

    async updateReleaseStatus(id: string, status: string, reason?: string) {
        const res = await fetch(`${API_BASE}/releases/${id}/status`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status, reason })
        });

        if (!res.ok) {
            throw new Error('Failed to update release status');
        }

        return await res.json();
    },

    // User requests takedown
    async requestTakedown(id: string) {
        const res = await fetch(`${API_BASE}/releases/${id}/takedown`, {
            method: 'PUT',
            headers: authHeaders()
        });

        if (!res.ok) {
            throw new Error('Failed to request takedown');
        }

        return await res.json();
    },

    // Update release data (for editing)
    async updateReleaseData(id: string, data: any) {
        const res = await fetch(`${API_BASE}/releases/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            throw new Error('Failed to update release');
        }

        return await res.json();
    },

    // Copyright
    async getTrackCopyrightStatus(trackId: string) {
        const res = await fetch(`${API_BASE}/tracks/${trackId}/copyright`, { headers: authHeaders() });
        if (!res.ok) return null;
        return res.json();
    },

    async scanTrack(trackId: string) {
        const res = await fetch(`${API_BASE}/tracks/${trackId}/scan`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Scan failed');
        return await res.json();
    },


    async getAnalyticsExternal() {
        const res = await fetch(`${API_BASE}/analytics/external`, { headers: authHeaders() });
        if (!res.ok) return null;
        return res.json();
    },

    async getAnalyticsHistory() {
        const res = await fetch(`${API_BASE}/analytics/history`, { headers: authHeaders() });
        if (!res.ok) return { history: [] };
        return res.json();
    },

    // Social Accounts
    async getSocialAccounts() {
        const res = await fetch(`${API_BASE}/social-accounts`, { headers: authHeaders() });
        if (!res.ok) return { accounts: [] };
        return res.json();
    },

    async addSocialAccount(platform: string, url: string, name?: string) {
        const res = await fetch(`${API_BASE}/social-accounts`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ platform, url, name })
        });
        if (!res.ok) throw new Error('Failed to add social account');
        return res.json();
    },

    async deleteSocialAccount(id: string) {
        const res = await fetch(`${API_BASE}/social-accounts/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete social account');
        return res.json();
    },

    // Admin: Social Accounts for specific user
    async getAdminUserSocialAccounts(userId: string) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}/social-accounts`, { headers: authHeaders() });
        if (!res.ok) return { accounts: [] };
        return res.json();
    },

    async addAdminUserSocialAccount(userId: string, platform: string, url: string, name?: string) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}/social-accounts`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ platform, url, name })
        });
        if (!res.ok) throw new Error('Failed to add social account');
        return res.json();
    },

    // YouTube Channel Search
    async searchYouTubeChannel(query: string) {
        const res = await fetch(`${API_BASE}/youtube/search?query=${encodeURIComponent(query)}`, { headers: authHeaders() });
        if (!res.ok) return { channels: [] };
        return res.json();
    },

    // Earnings
    async getEarnings(userId: string) {
        const res = await fetch(`${API_BASE}/earnings`, {
            headers: authHeaders()
        });

        if (!res.ok) {
            return [];
        }

        const data = await res.json();
        return data.earnings;
    },



    // Withdrawals
    async requestWithdrawal(amount: number, method: string, details: string) {
        const res = await fetch(`${API_BASE}/withdrawals`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ amount, method, details })
        });

        if (!res.ok) {
            throw new Error('Failed to request withdrawal');
        }

        return await res.json();
    },

    async getWithdrawals() {
        const res = await fetch(`${API_BASE}/withdrawals`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch withdrawals');
        const data = await res.json();
        return data.withdrawals;
    },

    async updateWithdrawalStatus(id: string, status: string, note?: string) {
        const res = await fetch(`${API_BASE}/admin/withdrawals/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status, note })
        });
        if (!res.ok) throw new Error('Failed to update withdrawal');
        return await res.json();
    },

    async getAllWithdrawals() {
        const res = await fetch(`${API_BASE}/admin/withdrawals`, {
            headers: authHeaders()
        });
        if (!res.ok) return []; // Return empty if endpoint not ready
        const data = await res.json();
        return data.withdrawals || [];
    },

    // Tickets
    async getTickets() {
        const res = await fetch(`${API_BASE}/tickets`, { headers: authHeaders() });
        if (!res.ok) return [];
        return await res.json();
    },

    async getAllTickets() {
        const res = await fetch(`${API_BASE}/tickets`, { headers: authHeaders() });
        if (!res.ok) return [];
        return await res.json();
    },

    async createTicket(subject: string, message: string) {
        const res = await fetch(`${API_BASE}/tickets`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ subject, message })
        });
        if (!res.ok) throw new Error('Failed to create ticket');
        return await res.json();
    },

    async getTicketMessages(id: string) {
        const res = await fetch(`${API_BASE}/tickets/${id}/messages`, { headers: authHeaders() });
        if (!res.ok) return [];
        return await res.json();
    },

    async respondTicket(id: string, message: string) {
        const res = await fetch(`${API_BASE}/tickets/${id}/reply`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ message })
        });
        if (!res.ok) throw new Error('Failed to respond to ticket');
        return await res.json();
    },

    async uploadTicketFile(ticketId: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/tickets/${ticketId}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!res.ok) throw new Error('Failed to upload file');
        return await res.json();
    },

    async optimizeSystem() {
        const res = await fetch(`${API_BASE}/admin/system/optimize`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Optimization failed');
        return await res.json();
    },

    async backupSystem() {
        const res = await fetch(`${API_BASE}/admin/system/backup`, {
            method: 'GET',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Backup failed');
        return await res.blob();
    },

    async restoreSystem(file: File) {
        const formData = new FormData();
        formData.append('backup', file);

        const res = await fetch(`${API_BASE}/admin/system/restore`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Restore failed');
        }
        return await res.json();
    },

    async adminRespondTicket(id: string, message: string) {
        const res = await fetch(`${API_BASE}/admin/tickets/${id}/reply`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ message })
        });
        if (!res.ok) throw new Error('Failed to respond to ticket');
        return await res.json();
    },

    restoreSystemWithProgress(file: File, onProgress: (percent: number) => void): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE}/admin/system/restore`);

            // Set headers
            xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error('Restore failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Network error during restore'));

            const formData = new FormData();
            formData.append('backup', file);
            xhr.send(formData);
        });
    },

    async closeTicket(id: string) {
        const res = await fetch(`${API_BASE}/admin/tickets/${id}/close`, {
            method: 'PUT',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to close ticket');
        return await res.json();
    },

    async toggleTicketUpload(id: string, allow: boolean) {
        const res = await fetch(`${API_BASE}/admin/tickets/${id}/toggle-upload`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ allow })
        });
        if (!res.ok) throw new Error('Failed to toggle upload permission');
        return await res.json();
    },

    async uploadTicketAttachment(id: string, file: File) {
        // First upload to generic file upload
        // In a real app, we might upload directly to a ticket endpoint with formData
        // But here we use the existing uploadFile helper which takes base64
        // So we need to convert file to base64 first

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64Data = (reader.result as string).split(',')[1];
                    // Upload to generic storage
                    const uploadRes = await apiService.uploadFile(file.name, base64Data, file.type);

                    // Link to ticket
                    const res = await fetch(`${API_BASE}/tickets/${id}/upload`, {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({
                            fileUrl: uploadRes.url,
                            fileName: file.name
                        })
                    });

                    if (!res.ok) throw new Error('Failed to attach file to ticket');
                    resolve(await res.json());
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = error => reject(error);
        });
    },

    // AI Tools
    async chat(messages: { text: string; sender: 'user' | 'ai' }[], persona?: string) {
        const res = await fetch(`${API_BASE}/ai/chat`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ messages, persona })
        });
        if (!res.ok) throw new Error('Failed to send chat message');
        const data = await res.json();
        return data.result;
    },

    async generateLyrics(topic: string, genre: string, mood: string, structure = 'Standard', rhymeDensity = 'High', complexity = 'Moderate', language = 'Turkish', key = '', bpm = '') {
        const res = await fetch(`${API_BASE}/ai/lyrics`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ topic, genre, mood, structure, rhymeDensity, complexity, language, key, bpm })
        });
        if (!res.ok) throw new Error('Failed to generate lyrics');
        const data = await res.json();
        return data.result;
    },

    async generatePitch(artistName: string, trackTitle: string, genre: string, features: string, similarArtists?: string, targetAudience?: string, tone?: string, campaignGoal?: string, storyAngle?: string) {
        const res = await fetch(`${API_BASE}/ai/pitch`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ artistName, trackTitle, genre, features, similarArtists, targetAudience, tone, campaignGoal, storyAngle })
        });
        if (!res.ok) throw new Error('Failed to generate pitch');
        const data = await res.json();
        return data.result;
    },

    async generateImage(prompt: string, style?: string, aspectRatio?: string, negativePrompt?: string) {
        const res = await fetch(`${API_BASE}/ai/image`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ prompt, style, aspectRatio, negativePrompt })
        });
        if (!res.ok) throw new Error('Failed to generate image');
        const data = await res.json();
        return data.result; // Returns URL
    },

    async analyzeAudio(file: File) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64Data = (reader.result as string).split(',')[1];
                    const res = await fetch(`${API_BASE}/ai/analyze-audio`, {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({
                            audioData: base64Data,
                            mimeType: file.type
                        })
                    });

                    if (!res.ok) throw new Error('Failed to analyze audio');
                    const data = await res.json();
                    resolve(data.result);
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = error => reject(error);
        });
    },

    async approveTakedown(id: string) {
        const res = await fetch(`${API_BASE}/releases/${id}/approve-takedown`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to approve takedown');
        return await res.json();
    },

    // Admin
    async getAllUsers() {
        const res = await fetch(`${API_BASE}/admin/users`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        return data.users;
    },

    async systemUpdate() {
        const res = await fetch(`${API_BASE}/admin/system-update`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Update failed');
        return await res.json();
    },

    async getPendingApplications() {
        const res = await fetch(`${API_BASE}/admin/applications`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch applications');
        const data = await res.json();
        return data.applications;
    },

    async reviewApplication(userId: string, approved: boolean, reason?: string) {
        const res = await fetch(`${API_BASE}/admin/applications/${userId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ approved, reason })
        });
        if (!res.ok) throw new Error('Failed to review application');
        return await res.json();
    },

    async getUserDetails(userId: string) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to fetch user details');
        return await res.json();
    },

    async getUserAnalytics(userId: string) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}/analytics`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to fetch user analytics');
        return await res.json();
    },

    async deleteUser(userId: string) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete user');
        return await res.json();
    },

    async banUser(userId: string, reason: string) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}/ban`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ reason })
        });
        if (!res.ok) throw new Error('Failed to ban user');
        return await res.json();
    },

    async unbanUser(userId: string) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}/unban`, {
            method: 'PUT',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to unban user');
        return await res.json();
    },

    async uploadFile(filename: string, data: string, type: string, artistName?: string) {
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ filename, data, type, artistName })
        });
        if (!res.ok) throw new Error('Failed to upload file');
        return await res.json();
    },

    uploadFileWithProgress(filename: string, data: string, type: string, onProgress: (percent: number) => void): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE}/upload`);

            // Set headers
            const headers = authHeaders(); // returns { Content-Type: ..., Authorization: ... }
            Object.keys(headers).forEach(key => {
                xhr.setRequestHeader(key, (headers as any)[key]);
            });

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error('Upload failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Network error during upload'));

            xhr.send(JSON.stringify({ filename, data, type }));
        });
    },

    getFileUrl(fileId: string) {
        return `${API_BASE}/files/${fileId}`;
    },

    // Admin Stats
    async getAdminStats() {
        const res = await fetch(`${API_BASE}/admin/stats`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        return data.stats;
    },

    // Admin Earnings
    async getMyEarnings() {
        const res = await fetch(`${API_BASE}/earnings`, {
            headers: authHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.earnings;
    },

    async getAllEarnings() {
        const res = await fetch(`${API_BASE}/admin/earnings`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch earnings');
        const data = await res.json();
        return data.earnings;
    },

    async addEarnings(userId: string, month: string, amount: number, streams: number, downloads: number) {
        const res = await fetch(`${API_BASE}/admin/earnings`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ userId, month, amount, streams, downloads })
        });
        if (!res.ok) throw new Error('Failed to add earnings');
        return await res.json();
    },

    async deleteEarnings(id: string) {
        const res = await fetch(`${API_BASE}/admin/earnings/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete earnings');
        return await res.json();
    },

    // Admin User Update
    async updateUser(userId: string, updates: { balance?: number; artistName?: string; role?: string; applicationStatus?: string; spotifyUrl?: string; youtubeUrl?: string }) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update user');
        return await res.json();
    },

    // Delete Release
    async deleteRelease(id: string) {
        const res = await fetch(`${API_BASE}/releases/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete release');
        return await res.json();
    },

    // Admin Track Editing
    async updateTrack(trackId: string, updates: any) {
        const res = await fetch(`${API_BASE}/admin/tracks/${trackId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update track');
        return await res.json();
    },

    // Admin Release Editing
    async updateRelease(releaseId: string, updates: any) {
        const res = await fetch(`${API_BASE}/admin/releases/${releaseId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update release');
        return await res.json();
    },

    async getSystemLogs() {
        const res = await fetch(`${API_BASE}/admin/system-logs`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch logs');
        return await res.json();
    },

    // Notifications
    async getNotifications() {
        const res = await fetch(`${API_BASE}/notifications`, {
            headers: authHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.notifications;
    },

    async markNotificationRead(id: string) {
        await fetch(`${API_BASE}/notifications/${id}/read`, {
            method: 'PUT',
            headers: authHeaders()
        });
    },


    // ==================== PAYMENT METHODS ====================
    async getPaymentMethods() {
        const res = await fetch(`${API_BASE}/payment-methods`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch payment methods');
        const data = await res.json();
        return data.paymentMethods;
    },

    async createPaymentMethod(data: { bankName: string; accountHolder: string; iban: string; swiftBic?: string; isDefault?: boolean }) {
        const res = await fetch(`${API_BASE}/payment-methods`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create payment method');
        return await res.json();
    },

    async setDefaultPaymentMethod(id: string) {
        const res = await fetch(`${API_BASE}/payment-methods/${id}/default`, {
            method: 'PUT',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to set default payment method');
        return await res.json();
    },

    async deletePaymentMethod(id: string) {
        const res = await fetch(`${API_BASE}/payment-methods/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete payment method');
        return await res.json();
    },

    // ==================== TEAMS ====================
    async getTeams() {
        const res = await fetch(`${API_BASE}/teams`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch teams');
        return await res.json();
    },

    async createTeam(name: string) {
        const res = await fetch(`${API_BASE}/teams`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Failed to create team');
        return await res.json();
    },

    async deleteTeam(id: string) {
        const res = await fetch(`${API_BASE}/teams/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete team');
        return await res.json();
    },

    async inviteToTeam(teamId: string, email: string, sharePercentage: number) {
        const res = await fetch(`${API_BASE}/teams/${teamId}/invite`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ email, sharePercentage })
        });
        if (!res.ok) throw new Error('Failed to send invite');
        return await res.json();
    },

    async acceptTeamInvite(inviteCode: string) {
        const res = await fetch(`${API_BASE}/teams/accept-invite`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ inviteCode })
        });
        if (!res.ok) throw new Error('Failed to accept invite');
        return await res.json();
    },

    async updateTeamMember(teamId: string, userId: string, sharePercentage: number) {
        const res = await fetch(`${API_BASE}/teams/${teamId}/members/${userId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ sharePercentage })
        });
        if (!res.ok) throw new Error('Failed to update member');
        return await res.json();
    },

    async removeTeamMember(teamId: string, userId: string) {
        const res = await fetch(`${API_BASE}/teams/${teamId}/members/${userId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to remove member');
        return await res.json();
    },

    // ==================== CONTRACTS ====================
    async getContracts() {
        const res = await fetch(`${API_BASE}/contracts`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch contracts');
        const data = await res.json();
        return data.contracts;
    },

    async createContract(releaseId: string, type: string, terms: string) {
        const res = await fetch(`${API_BASE}/contracts`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ releaseId, type, terms })
        });
        if (!res.ok) throw new Error('Failed to create contract');
        return await res.json();
    },

    async signContract(id: string) {
        const res = await fetch(`${API_BASE}/contracts/${id}/sign`, {
            method: 'PUT',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to sign contract');
        return await res.json();
    },

    // ==================== PROFILE ====================
    async getProfile() {
        const res = await fetch(`${API_BASE}/profile`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        return await res.json();
    },

    async updateProfile(data: {
        firstName?: string;
        lastName?: string;
        artistName?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
        profilePicture?: string;
        bio?: string;
        instagramUrl?: string;
        spotifyUrl?: string;
        soundcloudUrl?: string;
        youtubeUrl?: string;
        twitterUrl?: string;
        websiteUrl?: string;
    }) {
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to update profile');
        }
        return await res.json();
    },

    // ==================== ANALYTICS ====================
    async getAnalytics() {
        const res = await fetch(`${API_BASE}/analytics`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return await res.json();
    },

    // ==================== APPEAL ====================
    async getAppeal() {
        const res = await fetch(`${API_BASE}/appeal`, { headers: authHeaders() });
        if (!res.ok) return null;
        return await res.json();
    },

    async submitAppeal(message: string) {
        const res = await fetch(`${API_BASE}/appeal`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ message })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to submit appeal');
        }
        return await res.json();
    },

    // ==================== CLAIMS ====================
    async getClaims() {
        const res = await fetch(`${API_BASE}/claims`, { headers: authHeaders() });
        if (!res.ok) return [];
        const data = await res.json();
        return data.claims || [];
    },

    async createClaim(data: { type: string; email: string; artistId?: string; artistName?: string; artistLink?: string; channelUrl?: string }) {
        const res = await fetch(`${API_BASE}/claims`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to submit claim');
        return await res.json();
    },

    async getAllClaims() {
        const res = await fetch(`${API_BASE}/admin/claims`, { headers: authHeaders() });
        if (!res.ok) return [];
        const data = await res.json();
        return data.claims || [];
    },

    async updateClaimStatus(id: string, status: string, reason?: string) {
        const res = await fetch(`${API_BASE}/admin/claims/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status, reason })
        });
        if (!res.ok) throw new Error('Failed to update claim');
        return await res.json();
    },

    async adminUpdatePassword(userId: string, password: string) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}/password`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ password })
        });
        if (!res.ok) throw new Error('Failed to update password');
        return await res.json();
    }
};
