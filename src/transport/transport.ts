export interface Transport {
  // 接続を開始する
  start(): Promise<void>;

  // メッセージを送信する
  send(message: any): Promise<void>;

  // 接続を閉じる
  close(): Promise<void>;

  // メッセージ受信時のコールバック
  onmessage?: (message: any) => void;

  // エラー発生時のコールバック
  onerror?: (error: Error) => void;

  // 接続終了時のコールバック
  onclose?: () => void;

  // セッションID（ステートフルモードの場合）
  sessionId?: string;
}

export enum TransportType {
  STDIO = 'stdio',
  HTTP = 'http',
  WEBSOCKET = 'websocket'
}