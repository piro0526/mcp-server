import { Tool, ToolResult } from './types.js';

export const TOOLS: Tool[] = [
  {
    name: 'current_time',
    description: '現在の日時を返します',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'add',
    description: '二つの数値を足し算します',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '第一の数値'
        },
        b: {
          type: 'number',
          description: '第二の数値'
        }
      },
      required: ['a', 'b']
    }
  },
  {
    name: 'subtract',
    description: '二つの数値を引き算します (a - b)',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '被減数'
        },
        b: {
          type: 'number',
          description: '減数'
        }
      },
      required: ['a', 'b']
    }
  },
  {
    name: 'multiply',
    description: '二つの数値を掛け算します',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '第一の数値'
        },
        b: {
          type: 'number',
          description: '第二の数値'
        }
      },
      required: ['a', 'b']
    }
  },
  {
    name: 'divide',
    description: '二つの数値を割り算します (a ÷ b)',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '被除数'
        },
        b: {
          type: 'number',
          description: '除数'
        }
      },
      required: ['a', 'b']
    }
  },
  {
    name: 'calculate',
    description: '複数の数値と演算子を使って計算式を評価します',
    inputSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: '計算式 (例: "2 + 3 * 4", "10 / 2 - 1")'
        }
      },
      required: ['expression']
    }
  }
];

export class ToolExecutor {
  static execute(name: string, args: any): ToolResult {
    switch (name) {
      case 'current_time':
        return this.executeCurrentTime();
      case 'add':
        return this.executeAdd(args);
      case 'subtract':
        return this.executeSubtract(args);
      case 'multiply':
        return this.executeMultiply(args);
      case 'divide':
        return this.executeDivide(args);
      case 'calculate':
        return this.executeCalculate(args);
      default:
        throw new Error(`未知のツール: ${name}`);
    }
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

  private static executeAdd(args: any): ToolResult {
    const { a, b } = args;
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('a と b は数値である必要があります');
    }
    const result = a + b;
    return {
      content: [
        {
          type: 'text',
          text: `${a} + ${b} = ${result}`
        }
      ]
    };
  }

  private static executeSubtract(args: any): ToolResult {
    const { a, b } = args;
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('a と b は数値である必要があります');
    }
    const result = a - b;
    return {
      content: [
        {
          type: 'text',
          text: `${a} - ${b} = ${result}`
        }
      ]
    };
  }

  private static executeMultiply(args: any): ToolResult {
    const { a, b } = args;
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('a と b は数値である必要があります');
    }
    const result = a * b;
    return {
      content: [
        {
          type: 'text',
          text: `${a} × ${b} = ${result}`
        }
      ]
    };
  }

  private static executeDivide(args: any): ToolResult {
    const { a, b } = args;
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('a と b は数値である必要があります');
    }
    if (b === 0) {
      throw new Error('ゼロで割ることはできません');
    }
    const result = a / b;
    return {
      content: [
        {
          type: 'text',
          text: `${a} ÷ ${b} = ${result}`
        }
      ]
    };
  }

  private static executeCalculate(args: any): ToolResult {
    const { expression } = args;
    if (typeof expression !== 'string') {
      throw new Error('expression は文字列である必要があります');
    }

    try {
      // 安全な計算式の評価（基本的な四則演算のみ）
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
      if (sanitizedExpression !== expression) {
        throw new Error('無効な文字が含まれています。数値と +, -, *, /, (, ) のみ使用可能です');
      }

      // eval を使用（注意: 本番環境では適切なパーサーを使用することを推奨）
      const result = Function(`"use strict"; return (${sanitizedExpression})`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('計算結果が無効です');
      }

      return {
        content: [
          {
            type: 'text',
            text: `${expression} = ${result}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`計算エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}