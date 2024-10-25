import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ARService } from '../services/arService';
import { HeliusService } from '../services/heliusService';
import { DatabaseManager } from '../config/database';

export const getARExperience = async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, altitude } = req.query;
    const tenantId = req.tenantId!;

    const arService = new ARService();
    const heliusService = new HeliusService();

    const location = {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
      altitude: altitude ? parseFloat(altitude as string) : undefined
    };

    const arExperience = await arService.getARExperience(location);
    
    // Combine AR experience with NFT data if available
    const nftData = await heliusService.getAssetsByOwner(req.user?.walletAddress || '');
    
    const enrichedExperience = arExperience.map(exp => ({
      ...exp,
      nftData: nftData.find(nft => nft.id === exp.metadata?.nftId)
    }));

    res.json(enrichedExperience);
  } catch (error) {
    console.error('Error fetching AR experience:', error);
    res.status(500).json({ message: 'Failed to fetch AR experience' });
  }
};

export const createARAnchor = async (req: AuthRequest, res: Response) => {
  try {
    const { location, assetType, assetUrl, metadata } = req.body;
    const tenantId = req.tenantId!;

    const arService = new ARService();
    
    const anchorId = await arService.createARAnchor({
      id: `${tenantId}-${Date.now()}`,
      location,
      assetType,
      assetUrl,
      metadata
    });

    // Store AR anchor information in tenant's database
    await DatabaseManager.query(
      'INSERT INTO ar_anchors (anchor_id, location, asset_type, asset_url, metadata, tenant_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [anchorId, JSON.stringify(location), assetType, assetUrl, metadata, tenantId]
    );

    res.json({ anchorId });
  } catch (error) {
    console.error('Error creating AR anchor:', error);
    res.status(500).json({ message: 'Failed to create AR anchor' });
  }
};
