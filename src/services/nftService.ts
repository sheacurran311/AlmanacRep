import { Connection, PublicKey } from '@solana/web3.js';
import { 
  createUmi,
  keypairIdentity,
  generateSigner as createKeypairSigner
} from '@metaplex-foundation/umi-bundle-defaults';
import { 
  createTree,
  getBubblegumAuthorityPda,
  mplBubblegum
} from '@metaplex-foundation/mpl-bubblegum';
import { DatabaseManager } from '../config/database';
import { getTenantSchema } from '../config/supabase';

export class NFTService {
  private connection: Connection;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.connection = new Connection(process.env.METAPLEX_RPC || 'https://api.devnet.solana.com');
  }

  async createMerkleTree(maxDepth: number = 14, maxBufferSize: number = 64) {
    const umi = createUmi(process.env.METAPLEX_RPC || 'https://api.devnet.solana.com');
    
    // Generate a new keypair for the tree
    const payer = createKeypairSigner(umi);
    umi.use(keypairIdentity(payer));
    umi.use(mplBubblegum());

    const merkleTree = createKeypairSigner(umi);
    const authority = getBubblegumAuthorityPda(umi, { merkleTree: merkleTree.publicKey });

    try {
      const builder = createTree(umi, {
        merkleTree,
        maxDepth,
        maxBufferSize,
        public: true,
      });

      const result = await builder.sendAndConfirm(umi);

      // Store the merkle tree in tenant-specific schema
      await DatabaseManager.query(
        `INSERT INTO ${getTenantSchema(this.tenantId)}.merkle_trees 
         (public_key, max_depth, max_buffer_size) 
         VALUES ($1, $2, $3)`,
        [merkleTree.publicKey, maxDepth, maxBufferSize]
      );

      return {
        merkleTree: merkleTree.publicKey,
        authority: authority,
        signature: result.signature
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
