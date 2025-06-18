import { Request, Result, Notification } from './types.js';
import { MessageHandler } from './handlers.js';
import { HttpTransport } from './http-transport.js';

class MCPServer {
  private transport: HttpTransport;

  constructor(port: number = 3000) {
    this.transport = new HttpTransport(port);
    this.setupTransportHandlers();
  }

  private setupTransportHandlers() {
    // メッセージ受信時のハンドラー
    this.transport.onmessage = (message: Request) => {
      try {
        const response = this.handleRequest(message);
        this.transport.send(response);
      } catch (error) {
        const errorResponse = MessageHandler.createErrorResponse(
          message.id,
          -32603,
          `Internal error: ${error}`
        );
        this.transport.send(errorResponse);
      }
    };

    // エラー発生時のハンドラー
    this.transport.onerror = (error: Error) => {
      console.error('Transport error:', error);
    };

    // 接続終了時のハンドラー
    this.transport.onclose = () => {
      console.error('Transport closed');
    };
  }

  private handleRequest(request: Request): Result {
    console.error(`Received request: ${request.method}`);

    switch (request.method) {
      case 'initialize':
        return MessageHandler.handleInitialize(request);
      
      case 'tools/list':
        return MessageHandler.handleListTools(request);
      
      case 'tools/call':
        return MessageHandler.handleCallTool(request);
      
      default:
        return MessageHandler.createErrorResponse(
          request.id,
          -32601,
          `Method not found: ${request.method}`
        );
    }
  }

  async start() {
    try {
      await this.transport.start();
      console.log('MCP Server started successfully');
      console.log('Available endpoints:');
      console.log('  POST /mcp - MCP JSON-RPC endpoint');
      console.log('  GET /health - Health check endpoint');
      console.log('\nAvailable tools:');
      console.log('  - current_time: 現在の日時を取得');
      console.log('  - add: 二つの数値の加算');
      console.log('  - subtract: 二つの数値の減算');
      console.log('  - multiply: 二つの数値の乗算');
      console.log('  - divide: 二つの数値の除算');
      console.log('  - calculate: 計算式の評価');
    } catch (error) {
      console.error('Failed to start MCP Server:', error);
      process.exit(1);
    }
  }

  async stop() {
    await this.transport.close();
  }
}

// サーバーを起動
const server = new MCPServer(3000);

// グレースフルシャットダウンの処理
process.on('SIGINT', async () => {
  console.log('\nShutting down MCP Server...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down MCP Server...');
  await server.stop();
  process.exit(0);
});

// サーバー開始
server.start();