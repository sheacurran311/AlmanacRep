import { constants } from '../config/constants';

interface DigitalAsset {
  id: string;
  content: any;
  authorities: string[];
  compression: {
    eligible: boolean;
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    asset_hash: string;
    tree: string;
    seq: number;
    leaf_id: number;
  };
  grouping: any[];
  royalty: {
    basis_points: number;
    primary_sale_happened: boolean;
  };
  supply: {
    edition_nonce: number;
    max_supply: number;
  };
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate: string | null;
    owner: string;
    ownership_model: string;
  };
  creators: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
  mutable: boolean;
  burnt: boolean;
}

export class HeliusService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!constants.HELIUS.API_KEY) {
      throw new Error('Helius API key is not configured');
    }
    this.apiKey = constants.HELIUS.API_KEY;
    this.baseUrl = 'https://api.helius.xyz/v0';
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
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
    } catch (error) {
      console.error('Helius API request failed:', error);
      throw error;
    }
  }

  async getAssetsByOwner(ownerAddress: string): Promise<DigitalAsset[]> {
    try {
      const response = await this.makeRequest('/assets', 'POST', {
        ownerAddress,
        displayOptions: {
          showFungible: false,
          showNativeBalance: false,
        },
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch assets by owner:', error);
      throw error;
    }
  }

  async getAssetsByCreator(creatorAddress: string): Promise<DigitalAsset[]> {
    try {
      const response = await this.makeRequest('/assets', 'POST', {
        creatorAddress,
        displayOptions: {
          showFungible: false,
          showNativeBalance: false,
        },
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch assets by creator:', error);
      throw error;
    }
  }

  async getAssetsByMint(mintAddresses: string[]): Promise<DigitalAsset[]> {
    try {
      const response = await this.makeRequest('/assets', 'POST', {
        mintAccounts: mintAddresses,
        displayOptions: {
          showFungible: false,
          showNativeBalance: false,
        },
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch assets by mint:', error);
      throw error;
    }
  }

  async getCompressedNFTDetails(assetId: string): Promise<DigitalAsset> {
    try {
      const response = await this.makeRequest('/compression-details', 'POST', {
        assetId,
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch compressed NFT details:', error);
      throw error;
    }
  }
}
