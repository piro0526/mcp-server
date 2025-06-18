import { Tool, ToolResult } from './types.js';

export const TOOLS: Tool[] = [
  {
    name: 'hello',
    description: 'シンプルなHello Worldメッセージを返します',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '挨拶する相手の名前'
        }
      }
    }
  },
  {
    name: 'echo',
    description: '入力されたメッセージをそのまま返します',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'エコーするメッセージ'
        }
      },
      required: ['message']
    }
  },
  {
    name: 'current_time',
    description: '現在の日時を返します',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

export class ToolExecutor {
  static execute(name: string, args: any): ToolResult {
    switch (name) {
      case 'hello':
        return this.executeHello(args);
      case 'echo':
        return this.executeEcho(args);
      case 'current_time':
        return this.executeCurrentTime();
      default:
        throw new Error(`未知のツール: ${name}`);
    }
  }

  private static executeHello(args: any): ToolResult {
    const targetName = args?.name || 'World';
    return {
      content: [
        {
          type: 'text',
          text: `Hello, ${targetName}! MCPサーバーからの挨拶です。`
        }
      ]
    };
  }

  private static executeEcho(args: any): ToolResult {
    if (!args?.message) {
      throw new Error('messageパラメータが必要です');
    }
    return {
      content: [
        {
          type: 'text',
          text: `エコー: ${args.message}`
        }
      ]
    };
  }

  private static executeCurrentTime(): ToolResult {
    const now = new Date();
    return {
      content: [
        {
          type: 'text',
          text: `現在の日時: ${now.toISOString()}`
        }
      ]
    };
  }
}