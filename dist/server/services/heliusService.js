import { constants } from '../config/constants';
export class HeliusService {
    apiKey;
    baseUrl;
    constructor() {
        if (!constants.HELIUS.API_KEY) {
            throw new Error('Helius API key is not configured');
        }
        this.apiKey = constants.HELIUS.API_KEY;
        this.baseUrl = 'https://api.helius.xyz/v0';
    }
    async makeRequest(endpoint, method = 'GET', body) {
        const url = `${this.baseUrl}${endpoint}?api-key=${this.apiKey}`;
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) {
                throw new Error(`Helius API error: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Helius API request failed:', error);
            throw error;
        }
    }
    async getAssetsByOwner(ownerAddress) {
        try {
            const response = await this.makeRequest('/assets', 'POST', {
                ownerAddress,
                displayOptions: {
                    showFungible: false,
                    showNativeBalance: false,
                },
            });
            return response;
        }
        catch (error) {
            console.error('Failed to fetch assets by owner:', error);
            throw error;
        }
    }
    async getAssetsByCreator(creatorAddress) {
        try {
            const response = await this.makeRequest('/assets', 'POST', {
                creatorAddress,
                displayOptions: {
                    showFungible: false,
                    showNativeBalance: false,
                },
            });
            return response;
        }
        catch (error) {
            console.error('Failed to fetch assets by creator:', error);
            throw error;
        }
    }
    async getAssetsByMint(mintAddresses) {
        try {
            const response = await this.makeRequest('/assets', 'POST', {
                mintAccounts: mintAddresses,
                displayOptions: {
                    showFungible: false,
                    showNativeBalance: false,
                },
            });
            return response;
        }
        catch (error) {
            console.error('Failed to fetch assets by mint:', error);
            throw error;
        }
    }
    async getCompressedNFTDetails(assetId) {
        try {
            const response = await this.makeRequest('/compression-details', 'POST', {
                assetId,
            });
            return response;
        }
        catch (error) {
            console.error('Failed to fetch compressed NFT details:', error);
            throw error;
        }
    }
}
