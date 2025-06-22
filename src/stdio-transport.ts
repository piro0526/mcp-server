import * as readline from 'readline';
import { Transport, TransportType } from './transport.js';

export class StdioTransport implements Transport {
  private rl?: readline.Interface;
  private running: boolean = false;
  private protocolVersion: string = '2024-11-05'; // デフォルトプロトコルバージョン
  public sessionId?: string;

  public onmessage?: (message: any) => void;
  public onerror?: (error: Error) => void;
  public onclose?: () => void;

  constructor(sessionId?: string) {
    this.sessionId = sessionId;
  }

  async start(): Promise<void> {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    this.rl.on('line', (line: string) => {
      try {
        const message = JSON.parse(line.trim());
        if (this.onmessage) {
          this.onmessage(message);
        }
      } catch (error) {
        if (this.onerror) {
          this.onerror(new Error(`JSON parse error: ${error}`));
        }
      }
    });

    this.rl.on('close', () => {
      this.running = false;
      if (this.onclose) {
        this.onclose();
      }
    });

    this.rl.on('error', (error) => {
      if (this.onerror) {
        this.onerror(error);
      }
    });

    this.running = true;
  }

  async send(message: any): Promise<void> {
    const jsonMessage = JSON.stringify(message);
    console.log(jsonMessage);
  }

  async close(): Promise<void> {
    if (this.rl) {
      this.rl.close();
      this.rl = undefined;
      this.running = false;
    }
  }

  setProtocolVersion(version: string): void {
    this.protocolVersion = version;
    console.log(`STDIO Transport: Protocol version set to ${version}`);
  }

  getProtocolVersion(): string {
    return this.protocolVersion;
  }
}