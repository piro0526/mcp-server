# MCPサーバ技術調査レポート

## 1. 概要
### 1.1 調査目的
インターンの課題としてMCPサーバの技術調査を行った。
### 1.2 調査対象
### 1.3 調査期間

## 2. MCP（Model Context Protocol）とは
### 2.1 MCPの定義
### 2.2 MCPの特徴
### 2.3 MCPのアーキテクチャ

## 3. MCPサーバの技術仕様
### 3.1 プロトコル仕様
### 3.2 通信方式
### 3.3 データ形式

## 4. 実装方法
### 4.1 開発環境
### 4.2 必要なライブラリ・フレームワーク
### 4.3 実装手順

## 5. 実装例
### 5.1 基本的なMCPサーバ
### 5.2 応用例

## 6. パフォーマンス評価
### 6.1 測定環境
### 6.2 測定結果
### 6.3 考察

## 7. 課題と対策
### 7.1 技術的課題
### 7.2 運用上の課題
### 7.3 対策案

## 8. 今後の展望
### 8.1 技術トレンド
### 8.2 改善計画

## 9. まとめ

## 10. 参考文献

---

# MCP Server Protocol/Transport 分離アーキテクチャ実装レポート

## 概要

MCPサーバーにおいて、プロトコル処理とトランスポート機能の責任を明確に分離したアーキテクチャを実装しました。

## 実装したアーキテクチャ

### 1. Protocol層 (`protocol.ts`)

**責任:**
- JSON-RPC 2.0プロトコルの処理
- メッセージの検証とルーティング
- MCP固有のメソッド処理（initialize, tools/list, tools/call）
- エラーハンドリング

**主要インターフェース:**
```typescript
interface Protocol {
  processMessage(message: any): Promise<Result | null>;
  createErrorResponse(id: number | string | null, code: number, message: string, data?: any): Result;
  validateRequest(message: any): boolean;
  getCapabilities(): Record<string, any>;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}
```

**実装クラス:**
- `MCPProtocol`: JSON-RPC 2.0ベースのMCPプロトコル実装

### 2. Transport層 (`transport.ts`)

**責任:**
- 低レベル通信の抽象化
- メッセージの送受信
- 接続管理（開始、停止）
- トランスポート固有のエラーハンドリング

**主要インターフェース:**
```typescript
interface Transport {
  start(): Promise<void>;
  send(message: any): Promise<void>;
  close(): Promise<void>;
  onmessage?: (message: any) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;
  setProtocolVersion(version: string): void;
}
```

**実装クラス:**
- `HttpTransport`: Express.jsベースのHTTPトランスポート
- `StdioTransport`: 標準入出力ベースのトランスポート

### 3. MCPServer統合クラス

**責任:**
- ProtocolとTransportの組み合わせ
- 動的ツール登録システム
- サーバーライフサイクル管理

## 分離によるメリット

### 1. 関心の分離 (Separation of Concerns)
- **Protocol層**: ビジネスロジックとメッセージ処理
- **Transport層**: 通信メカニズム
- 各層が独立して開発・テスト可能

### 2. 拡張性
- 新しいトランスポート（WebSocket、gRPCなど）の追加が容易
- プロトコルバージョンアップグレードが独立して可能

### 3. テスト容易性
- 各層を独立してモックやスタブでテスト可能
- 統合テストでの問題の切り分けが容易

### 4. 保守性
- 責任が明確なため、変更の影響範囲が限定的
- コードの理解と修正が容易

## 実装されたツール機能

### 動的ツール登録システム
```typescript
// 簡単な登録
MCPServer.tool("hello", async () => ({
  content: [{ type: "text", text: "Hello!" }]
}));

// 詳細な登録（スキーマ付き）
MCPServer.tool(
  "add",
  {
    title: "Add Numbers",
    description: "二つの数値を足し算します",
    inputSchema: {
      type: 'object',
      properties: {
        a: { type: 'number', description: '第一の数値' },
        b: { type: 'number', description: '第二の数値' }
      },
      required: ['a', 'b']
    }
  },
  async (args) => {
    const { a, b } = args || {};
    return { content: [{ type: "text", text: `${a} + ${b} = ${a + b}` }] };
  }
);
```

## 実行確認

### サーバー起動
```bash
npm run build
npm start
```

**出力:**
```
MCP Protocol initialized: hello-world-mcp-server v1.0.0
HTTP Transport started on port 3001
🚀 MCP Server started successfully
📡 Transport: http
🔄 Running: true

📍 Available endpoints:
  POST /mcp - MCP JSON-RPC endpoint
  GET /health - Health check
  GET /tools - Debug tools list

🛠️  Registered tools:
  - hello: 動的ツール: hello
  - current_time: 動的ツール: current_time
  - add: 二つの数値を足し算します
```

### API動作確認

#### 初期化リクエスト
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}'
```

**レスポンス:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {"tools": {}},
    "serverInfo": {
      "name": "hello-world-mcp-server",
      "version": "1.0.0"
    }
  }
}
```

#### ツール実行
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "add", "arguments": {"a": 15, "b": 27}}}'
```

**レスポンス:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [{"type": "text", "text": "15 + 27 = 42"}]
  }
}
```

## ファイル構成

```
src/
├── types.ts           # 共通型定義
├── protocol.ts        # Protocol層インターフェース・実装
├── transport.ts       # Transport層インターフェース
├── http-transport.ts  # HTTP Transport実装
├── stdio-transport.ts # STDIO Transport実装
├── helloworld.ts      # MCPServer統合クラス・起動スクリプト
└── handlers.ts        # (レガシー: 使用していません)
```

## まとめ

Protocol/Transport分離アーキテクチャの実装により、以下を達成しました：

1. ✅ **明確な責任分離**: プロトコル処理とトランスポートの完全分離
2. ✅ **高い拡張性**: 新しいトランスポートの追加が容易
3. ✅ **保守性の向上**: 各層の独立性による変更影響の局所化
4. ✅ **動的ツール登録**: 柔軟なツール追加システム
5. ✅ **完全動作確認**: 実際のHTTP通信でのテスト完了

このアーキテクチャにより、今後のMCPサーバー拡張において、プロトコル進化とトランスポート多様化の両方に対応できる基盤が整いました。

---

## setProtocolVersion機能の実装と検証

### 機能拡張の概要

Transportインターフェースに`setProtocolVersion(version: string): void`メソッドを追加し、プロトコルバージョンの動的管理機能を実装しました。

### 実装内容

#### 1. Transportインターフェース拡張
```typescript
interface Transport {
  // ...existing methods...
  setProtocolVersion(version: string): void;
}
```

#### 2. HttpTransport・StdioTransport実装
- プライベートフィールド`protocolVersion`を追加
- `setProtocolVersion()`メソッドでバージョン設定とログ出力
- `getProtocolVersion()`メソッドで現在のバージョン取得

#### 3. MCPServer統合
- コンストラクタでデフォルトプロトコルバージョン（`2024-11-05`）を設定
- 動的バージョン変更メソッド`setProtocolVersion()`を公開
- 現在バージョン取得メソッド`getProtocolVersion()`を公開

#### 4. 管理ツール追加
```typescript
// プロトコルバージョン確認ツール
MCPServer.tool("get_protocol_version", ...)

// プロトコルバージョン設定ツール  
MCPServer.tool("set_protocol_version", ...)
```

### 動作確認結果

#### サーバー起動時
```
HTTP Transport: Protocol version set to 2024-11-05
🛠️  Registered tools:
  - get_protocol_version: 現在のプロトコルバージョンを取得します
  - set_protocol_version: プロトコルバージョンを設定します
```

#### バージョン確認テスト
```bash
curl -X POST /mcp -d '{"method": "tools/call", "params": {"name": "get_protocol_version"}}'
# → "現在のプロトコルバージョン: 2024-11-05"
```

#### バージョン変更テスト
```bash
curl -X POST /mcp -d '{"method": "tools/call", "params": {"name": "set_protocol_version", "arguments": {"version": "2025-06-20"}}}'
# → "プロトコルバージョンを 2025-06-20 に設定しました"
# ログ: HTTP Transport: Protocol version set to 2025-06-20
```

#### 変更確認テスト
```bash
curl -X POST /mcp -d '{"method": "tools/call", "params": {"name": "get_protocol_version"}}'
# → "現在のプロトコルバージョン: 2025-06-20"
```

### 実装メリット

1. **実行時バージョン管理**: サーバー再起動なしでプロトコルバージョンを変更可能
2. **プロトコル進化対応**: 新しいプロトコルバージョンに柔軟に対応
3. **トランスポート層への伝播**: プロトコル変更がトランスポート層にも適切に反映
4. **管理ツール統合**: API経由でのバージョン管理が可能
5. **ログ追跡**: プロトコルバージョン変更の監査証跡

### アーキテクチャの完成

```
MCPServer
├── Protocol (MCPProtocol)
│   ├── processMessage()
│   ├── validateRequest() 
│   └── getCapabilities()
└── Transport (HttpTransport | StdioTransport)
    ├── start() / close() / send()
    ├── onmessage / onerror / onclose
    ├── sessionId
    └── setProtocolVersion() ← 新機能
```

**✅ 実装完了**: Protocol/Transport分離アーキテクチャにプロトコルバージョン管理機能が完全統合され、本格的な運用環境で使用できる基盤が完成しました。

---

## Transportインターフェースの最適化

### getType・isRunningメソッドの削除

Transport層の責任をより明確にするため、以下のメソッドを削除しました：

#### 削除されたメソッド
- `getType(): TransportType` - トランスポートタイプの取得
- `isRunning(): boolean` - 稼働状態の確認

#### 代替実装
MCPServerクラス内でこれらの情報を管理するように変更：

```typescript
class MCPServer {
  private transportType: TransportType;  // コンストラクタで設定
  private running: boolean = false;      // start()/stop()で管理
  
  // 公開メソッドで提供
  getTransportType(): TransportType { return this.transportType; }
  isRunning(): boolean { return this.running; }
}
```

#### 変更の利点

1. **責任の明確化**: Transport層は純粋に通信処理のみを担当
2. **依存関係の軽減**: Transport実装クラスがTransportTypeへの依存を削除
3. **状態管理の一元化**: MCPServerクラスで全体の状態を統一管理
4. **インターフェースの簡素化**: 必要最小限のメソッドのみ保持

#### 最終的なTransportインターフェース

```typescript
export interface Transport {
  start(): Promise<void>;
  send(message: any): Promise<void>;
  close(): Promise<void>;
  onmessage?: (message: any) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;
  sessionId?: string;
  setProtocolVersion(version: string): void;
}
```

#### 動作確認結果

```
🚀 MCP Server started successfully
📡 Transport: http
🔄 Running: true

API動作確認:
✅ Hello Tool: "Hello from separated Protocol/Transport architecture!"
✅ Protocol Version: "現在のプロトコルバージョン: 2024-11-05"
```

**実装完了**: シンプルで明確な責任分離を持つTransportアーキテクチャが完成しました。
