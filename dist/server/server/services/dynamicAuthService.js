import { constants } from '../../config/constants.js';
export class DynamicAuthService {
    config;
    constructor() {
        if (!constants.DYNAMIC.ENVIRONMENT_ID || !constants.DYNAMIC.API_KEY) {
            throw new Error('Dynamic.xyz configuration is missing');
        }
        this.config = {
            environmentId: constants.DYNAMIC.ENVIRONMENT_ID,
            apiKey: constants.DYNAMIC.API_KEY
        };
    }
    async verifyAuthToken(token) {
        try {
            const response = await fetch('https://api.dynamic.xyz/v1/auth/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });
            if (!response.ok) {
                throw new Error('Failed to verify Dynamic.xyz token');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Dynamic.xyz token verification failed:', error);
            throw error;
        }
    }
}
