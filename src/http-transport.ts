import express from 'express';
import { Transport } from './transport.js';

export class HttpTransport implements Transport {
  private app: express.Application;
  private server?: any;
  private port: number;
  private pendingResponses: Map<string | number, express.Response> = new Map();
  private running: boolean = false;
  private protocolVersion: string = '2024-11-05'; // デフォルトプロトコルバージョン
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
  }

  private setupRoutes() {
    // MCP JSON-RPCエンドポイント
    this.app.post('/mcp', (req, res) => {
      try {
        const request = req.body;

        // リクエストIDとレスポンスオブジェクトを紐付けて保存
        if (request.id !== undefined) {
          this.pendingResponses.set(request.id, res);
        }

        if (this.onmessage) {
          this.onmessage(request);
        }

        // 通知の場合（IDがない）は即座にレスポンスを返す
        if (request.id === undefined) {
          res.status(200).end();
        }
      } catch (error) {
        if (this.onerror) {
          this.onerror(error as Error);
        }
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // ヘルスチェック
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      });
    });

    // ツール一覧（デバッグ用）
    this.app.get('/tools', (req, res) => {
      const toolsListRequest = {
        jsonrpc: '2.0' as const,
        id: 'debug-tools-list',
        method: 'tools/list'
      };

      if (this.onmessage) {
        this.onmessage(toolsListRequest);
        // デバッグ用なので簡単なレスポンスを返す
        res.json({ message: 'Check console for tools list' });
      } else {
        res.status(503).json({ error: 'Server not ready' });
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        this.running = true;
        console.error(`HTTP Transport started on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (error: Error) => {
        this.running = false;
        if (this.onerror) {
          this.onerror(error);
        }
        reject(error);
      });
    });
  }

  async send(message: any): Promise<void> {
    const messageId = message.id;

    if (messageId !== undefined && this.pendingResponses.has(messageId)) {
      // 対応するHTTPレスポンスオブジェクトを取得
      const res = this.pendingResponses.get(messageId);
      this.pendingResponses.delete(messageId);

      if (res) {
        res.json(message);
      }
    } else {
      // レスポンス待ちがない場合はコンソールに出力（デバッグ用）
      console.log('HTTP Response (no pending request):', JSON.stringify(message, null, 2));
    }
  }

  async close(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.running = false;
          if (this.onclose) {
            this.onclose();
          }
          resolve();
        });
      });
    }
  }

  setProtocolVersion(version: string): void {
    this.protocolVersion = version;
    console.log(`HTTP Transport: Protocol version set to ${version}`);
  }

  getProtocolVersion(): string {
    return this.protocolVersion;
  }

  getApp(): express.Application {
    return this.app;
  }
}