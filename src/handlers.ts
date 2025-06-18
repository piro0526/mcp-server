import { Request, Result } from './types.js';
import { TOOLS, ToolExecutor } from './tools.js';

export class MessageHandler {
  static handleInitialize(request: Request): Result {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'hello-world-mcp-server',
          version: '1.0.0'
        }
      }
    };
  }

  static handleListTools(request: Request): Result {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: TOOLS
      }
    };
  }

  static handleCallTool(request: Request): Result {
    const { name, arguments: args } = request.params;

    try {
      const result = ToolExecutor.execute(name, args);
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      return this.createErrorResponse(request.id, -32603, `ツール実行エラー: ${error}`);
    }
  }

  static createErrorResponse(id: number | string, code: number, message: string, data?: any): Result {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }
}