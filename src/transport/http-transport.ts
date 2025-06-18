import express from 'express';
import { Transport } from './transport.js';

export class HttpTransport implements Transport {
  private app: express.Application;
  private server?: any;
  private port: number;
  public sessionId?: string;
  
  public onmessage?: (message: any) => void;
  public onerror?: (error: Error) => void;
  public onclose?: () => void;

  constructor(port: number = 3000, sessionId?: string) {
    this.port = port;
    this.sessionId = sessionId;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // CORS対応
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  private setupRoutes() {
    // MCP JSON-RPCエンドポイント
    this.app.post('/mcp', (req, res) => {
      try {
        if (this.onmessage) {
          this.onmessage(req.body);
        }
        // レスポンスは別途sendメソッドで処理
        res.status(200);
      } catch (error) {
        if (this.onerror) {
          this.onerror(error as Error);
        }
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // ヘルスチェック
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        sessionId: this.sessionId,
        timestamp: new Date().toISOString() 
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.error(`HTTP Transport started on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (error: Error) => {
        if (this.onerror) {
          this.onerror(error);
        }
        reject(error);
      });
    });
  }

  async send(message: any): Promise<void> {
    // HTTPの場合、レスポンスは非同期で処理される
    // 実際の実装では、リクエスト-レスポンスのマッピングが必要
    console.log('HTTP Response:', JSON.stringify(message));
  }

  async close(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          if (this.onclose) {
            this.onclose();
          }
          resolve();
        });
      });
    }
  }

  getApp(): express.Application {
    return this.app;
  }
}