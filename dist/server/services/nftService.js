import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { DatabaseManager } from '../config/database.js';
import { getTenantSchema } from '../config/supabase.js';
export class NFTService {
    tenantId;
    umi;
    constructor(tenantId) {
        this.tenantId = tenantId;
        this.umi = createUmi(process.env.METAPLEX_RPC || 'https://api.devnet.solana.com');
    }
    async createMerkleTree(params) {
        try {
            const { maxDepth = 14, maxBufferSize = 64 } = params;
            const result = await DatabaseManager.query(`INSERT INTO ${getTenantSchema(this.tenantId)}.merkle_trees 
         (max_depth, max_buffer_size) 
         VALUES ($1, $2)
         RETURNING id`, [maxDepth, maxBufferSize]);
            // Get latest blockhash
            const latestBlockhash = await this.umi.rpc.getLatestBlockhash();
            // Create transaction message with proper typing
            const message = {
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
            const transaction = {
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
        }
        catch (error) {
            console.error('Error creating merkle tree:', error);
            throw error;
        }
    }
    async logNFTOperation(operation, metadata) {
        await DatabaseManager.query(`INSERT INTO ${getTenantSchema(this.tenantId)}.audit_logs 
       (action, entity_type, entity_id, metadata) 
       VALUES ($1, $2, $3, $4)`, [operation, 'NFT', metadata.id, metadata]);
    }
}
