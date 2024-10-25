import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NFTService } from '../services/nftService';
import { DatabaseManager } from '../config/database';

export const createMerkleTree = async (req: AuthRequest, res: Response) => {
  try {
    const { maxDepth, maxBufferSize } = req.body;
    const tenantId = req.tenantId!;

    const nftService = new NFTService(tenantId);
    const result = await nftService.createMerkleTree(maxDepth, maxBufferSize);

    // Log the operation
    await nftService.logNFTOperation('CREATE_MERKLE_TREE', {
      id: result.merkleTree,
      maxDepth,
      maxBufferSize
    });

    res.json(result);
  } catch (error) {
    console.error('Error creating merkle tree:', error);
    res.status(500).json({ message: 'Failed to create merkle tree' });
  }
};

export const getMerkleTrees = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    
    const result = await DatabaseManager.query(
      'SELECT * FROM merkle_trees WHERE tenant_id = $1',
      [tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching merkle trees:', error);
    res.status(500).json({ message: 'Failed to fetch merkle trees' });
  }
};
