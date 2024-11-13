import { RetryManager } from '../../utils/retry';
import { env } from '../utils/setupEnv';

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private retryManager: RetryManager;
  private isConnecting: boolean = false;

  private constructor() {
    this.retryManager = new RetryManager({
      maxRetries: env.ws.reconnect.maxRetries,
      initialDelay: env.ws.reconnect.minDelay,
      maxDelay: env.ws.reconnect.maxDelay,
      factor: 2,
      onRetry: (attempt, error) => {
        console.log(`[${new Date().toISOString()}] [WebSocket] Reconnection attempt ${attempt}:`, {
          error: error.message,
          nextAttemptIn: Math.min(env.ws.reconnect.minDelay * Math.pow(2, attempt), env.ws.reconnect.maxDelay)
        });
      }
    });
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    try {
      await this.retryManager.execute(async () => {
        return new Promise((resolve, reject) => {
          const wsUrl = `${env.ws.protocol}://${env.ws.host}${env.ws.port !== 443 ? `:${env.ws.port}` : ''}/ws`;
          this.ws = new WebSocket(wsUrl);

          const connectionTimeout = setTimeout(() => {
            if (this.ws?.readyState !== WebSocket.OPEN) {
              this.ws?.close();
              reject(new Error('WebSocket connection timeout'));
            }
          }, env.ws.reconnect.timeout);

          this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            this.isConnecting = false;
            this.connectionHandlers.forEach(handler => handler());
            resolve(undefined);
          };

          this.ws.onclose = () => {
            clearTimeout(connectionTimeout);
            this.isConnecting = false;
            this.reconnect();
          };

          this.ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.error('[WebSocket] Connection error:', error);
            reject(error);
          };

          this.ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.messageHandlers.forEach(handler => handler(data));
            } catch (error) {
              console.error('[WebSocket] Message parsing error:', error);
            }
          };
        });
      });
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  private async reconnect(): Promise<void> {
    if (this.isConnecting) return;
    await this.connect();
  }

  addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  addConnectionHandler(handler: ConnectionHandler): void {
    this.connectionHandlers.add(handler);
  }

  removeConnectionHandler(handler: ConnectionHandler): void {
    this.connectionHandlers.delete(handler);
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send message: connection not open');
    }
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
  }
}

export const webSocketService = WebSocketService.getInstance();
export default webSocketService;
