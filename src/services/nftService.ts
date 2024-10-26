import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  Transaction,
  TransactionMessage,
} from '@metaplex-foundation/umi';
import { DatabaseManager } from '../config/database.js';
import { getTenantSchema } from '../config/supabase.js';

interface CreateMerkleTreeParams {
  maxDepth: number;
  maxBufferSize: number;
}

interface CreateMerkleTreeResult {
  merkleTreeId: string;
  maxDepth: number;
  maxBufferSize: number;
  transactionId: string;
}

export class NFTService {
  private tenantId: string;
  private readonly umi: ReturnType<typeof createUmi>;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.umi = createUmi(process.env.METAPLEX_RPC || 'https://api.devnet.solana.com');
  }

  async createMerkleTree(params: CreateMerkleTreeParams): Promise<CreateMerkleTreeResult> {
    try {
      const { maxDepth = 14, maxBufferSize = 64 } = params;
      const result = await DatabaseManager.query(
        `INSERT INTO ${getTenantSchema(this.tenantId)}.merkle_trees 
         (max_depth, max_buffer_size) 
         VALUES ($1, $2)
         RETURNING id`,
        [maxDepth, maxBufferSize]
      );

      // Get latest blockhash
      const latestBlockhash = await this.umi.rpc.getLatestBlockhash();

      // Create transaction message with proper typing
      const message: TransactionMessage = {
        version: 'legacy',
        instructions: [],
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 0
        },
        accounts: [],
        blockhash: latestBlockhash.blockhash,
        addressLookupTables: []
      };

      // Create transaction with proper interface
      const transaction: Transaction = {
        message,
        serializedMessage: this.umi.transactions.serializeMessage(message),
        signatures: []
      };

      const tx = await this.umi.rpc.sendTransaction(transaction);
      const signature = tx instanceof Uint8Array ? tx.toString() : tx;

      return {
        merkleTreeId: result.rows[0].id,
        maxDepth,
        maxBufferSize,
        transactionId: signature
      };
    } catch (error) {
      console.error('Error creating merkle tree:', error);
      throw error;
    }
  }

  async logNFTOperation(operation: string, metadata: Record<string, unknown>): Promise<void> {
    await DatabaseManager.query(
      `INSERT INTO ${getTenantSchema(this.tenantId)}.audit_logs 
       (action, entity_type, entity_id, metadata) 
       VALUES ($1, $2, $3, $4)`,
      [operation, 'NFT', metadata.id, metadata]
    );
  }
}
