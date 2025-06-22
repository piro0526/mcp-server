import { JSONRPCRequest, JSONRPCResponse, JSONRPCNotification, JSONRPCError } from "./types.js";
/**
 * トランスポート層のインターフェース
 * 低レベルな通信の詳細（HTTP、WebSocket、STDIO等）を抽象化し、
 * メッセージの送受信のみを担当
 */
export type TransportSendOptions = {
  /**
   * If present, `relatedRequestId` is used to indicate to the transport which incoming request to associate this outgoing message with.
   */
  relatedRequestId?: string | number;

  /**
   * The resumption token used to continue long-running requests that were interrupted.
   *
   * This allows clients to reconnect and continue from where they left off, if supported by the transport.
   */
  resumptionToken?: string;

  /**
   * A callback that is invoked when the resumption token changes, if supported by the transport.
   *
   * This allows clients to persist the latest token for potential reconnection.
   */
  onresumptiontoken?: (token: string) => void;
}

export interface Transport {
  /**
   * トランスポートを開始（サーバー起動、接続確立等）
   */
  start(): Promise<void>;

  /**
   * メッセージを送信
   */
  send(message: any, options?: TransportSendOptions): Promise<void>;

  /**
   * トランスポートを閉じる（サーバー停止、接続切断等）
   */
  close(): Promise<void>;

  /**
   * メッセージ受信時のコールバック
   * プロトコル層がこのコールバックでメッセージを受け取る
   */
  onmessage?: (message: JSONRPCRequest | JSONRPCResponse | JSONRPCNotification) => void;

  /**
   * トランスポートレベルのエラー発生時のコールバック
   */
  onerror?: (error: Error) => void;

  /**
   * 接続終了時のコールバック
   */
  onclose?: () => void;

  /**
   * セッションID（ステートフルモードの場合）
   * HTTPトランスポートなどで複数のクライアントを区別するために使用
   */
  sessionId?: string;

  /**
   * プロトコルバージョンを設定
   */
  setProtocolVersion?: (version: string) => void;
}