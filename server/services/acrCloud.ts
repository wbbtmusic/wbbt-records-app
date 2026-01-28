import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

// Interfaces for ACRCloud Response
interface ACRCloudResponse {
    status: {
        msg: string;
        code: number;
        version: string;
    };
    metadata?: {
        music?: Array<{
            external_ids: any;
            play_offset_ms: number;
            release_date: string;
            title: string;
            artists: Array<{ name: string }>;
            album: { name: string };
            score: number;
            label?: string;
            duration_ms: number;
        }>;
    };
}

export class ACRCloudService {
    private host: string;
    private accessKey: string;
    private accessSecret: string;

    constructor() {
        this.host = process.env.ACR_HOST || 'identify-eu-west-1.acrcloud.com';
        this.accessKey = process.env.ACR_ACCESS_KEY || '';
        this.accessSecret = process.env.ACR_SECRET_KEY || '';

        if (!this.accessKey || !this.accessSecret) {
            console.warn('⚠️ ACRCloud credentials missing. Copyright checks will fail.');
        }
    }

    /**
     * Identify an audio file
     * @param filePath Absolute path to the audio file
     */
    async identify(filePath: string): Promise<{ success: boolean; data?: any; error?: string }> {
        if (!this.accessKey || !this.accessSecret) {
            return { success: false, error: 'Missing Credentials' };
        }

        try {
            const bitmap = fs.readFileSync(filePath);
            const buffer = Buffer.from(bitmap);

            const method = 'POST';
            const httpUri = '/v1/identify';
            const dataType = 'audio';
            const signatureVersion = '1';
            const timestamp = Math.floor(Date.now() / 1000).toString();

            const stringToSign = [
                method,
                httpUri,
                this.accessKey,
                dataType,
                signatureVersion,
                timestamp
            ].join('\n');

            const signature = crypto
                .createHmac('sha1', this.accessSecret)
                .update(Buffer.from(stringToSign, 'utf-8'))
                .digest('base64');

            const formData = new FormData();
            formData.append('sample', buffer);
            formData.append('access_key', this.accessKey);
            formData.append('data_type', dataType);
            formData.append('signature_version', signatureVersion);
            formData.append('signature', signature);
            formData.append('timestamp', timestamp);

            const response = await axios.post<ACRCloudResponse>(`https://${this.host}${httpUri}`, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            const result = response.data;

            if (result.status.code === 0 && result.metadata?.music && result.metadata.music.length > 0) {
                // Match found
                return {
                    success: true,
                    data: {
                        status: 'MATCH',
                        matches: result.metadata.music.map(m => ({
                            title: m.title,
                            artist: m.artists.map(a => a.name).join(', '),
                            album: m.album.name,
                            label: m.label,
                            score: m.score,
                            release_date: m.release_date
                        }))
                    }
                };
            } else if (result.status.code === 1001) {
                // No Match
                return { success: true, data: { status: 'NO_MATCH' } };
            } else {
                // Error or other status
                console.error('ACRCloud Error Response:', result);
                return { success: false, error: result.status.msg };
            }

        } catch (error: any) {
            console.error('ACRCloud Request Failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

export const acrCloudService = new ACRCloudService();
