import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { DatabaseManager } from '../config/database';
import { getTenantSchema } from '../config/supabase';
import { PublicKey } from '@solana/web3.js';

interface UmiTransaction {
  version: number;
  instructions: Array<{
    programId: PublicKey;
    keys: Array<{
      pubkey: PublicKey;
      isSigner: boolean;
      isWritable: boolean;
    }>;
    data: Buffer;
  }>;
}

export class NFTService {
  private tenantId: string;
  private readonly umi: ReturnType<typeof createUmi>;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.umi = createUmi(process.env.METAPLEX_RPC || 'https://api.devnet.solana.com');
  }

  async createMerkleTree(maxDepth: number = 14, maxBufferSize: number = 64) {
    try {
      // Store the merkle tree configuration in tenant-specific schema
      const result = await DatabaseManager.query(
        `INSERT INTO ${getTenantSchema(this.tenantId)}.merkle_trees 
         (max_depth, max_buffer_size) 
         VALUES ($1, $2)
         RETURNING id`,
        [maxDepth, maxBufferSize]
      );

      // Create the merkle tree using the UMI instance
      const tx = {
        version: 0,
        instructions: [{
          programId: new PublicKey(process.env.BUBBLEGUM_PROGRAM_ID || ''),
          keys: [],
          data: Buffer.from([])
        }]
      };

      const txId = await this.umi.rpc.sendTransaction(tx as any);

      return {
        merkleTreeId: result.rows[0].id,
        maxDepth,
        maxBufferSize,
        transactionId: txId.toString()
      };
    } catch (error) {
      console.error('Error creating merkle tree:', error);
      throw error;
    }
  }

  async logNFTOperation(operation: string, metadata: any) {
    await DatabaseManager.query(
      `INSERT INTO ${getTenantSchema(this.tenantId)}.audit_logs 
       (action, entity_type, entity_id, metadata) 
       VALUES ($1, $2, $3, $4)`,
      [operation, 'NFT', metadata.id, metadata]
    );
  }
}
