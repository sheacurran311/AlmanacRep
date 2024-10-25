import { Request, Response } from 'express';
import { NFTService } from '../services/nftService';

export const createMerkleTree = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { maxDepth, maxBufferSize } = req.body;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const nftService = new NFTService(tenantId);
    const result = await nftService.createMerkleTree(maxDepth, maxBufferSize);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating merkle tree:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMerkleTrees = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const result = await DatabaseManager.query(
      `SELECT * FROM ${getTenantSchema(tenantId)}.merkle_trees`,
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching merkle trees:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
