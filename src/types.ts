export const LATEST_PROTOCOL_VERSION = "2025-06-18";
export const DEFAULT_NEGOTIATED_PROTOCOL_VERSION = "2025-03-26";
export const SUPPORTED_PROTOCOL_VERSIONS = [
  LATEST_PROTOCOL_VERSION,
  "2025-03-26",
  "2024-11-05",
  "2024-10-07",
];


export type RequestId = string | number;

export type Request = {
  method: string;
  params?: {
    [key: string]: unknown;
  };
};

export type Notification = {
  method: string;
  params?: {
    [key: string]: unknown;
  };
}

export type JSONRPCRequest = Request & {
  jsonrpc: "2.0";
  id: RequestId;
}

export type JSONRPCResponse = {
  jsonrpc: "2.0";
  id: RequestId;
  result?: Result;
}

export type JSONRPCNotification = Notification & {
  jsonrpc: "2.0";
}

export type Result = {
  [key: string]: unknown;
}

export type ClientCapabilities = {
  sampling?: {
    [key: string]: unknown;
  };
  elicitation?: {
    [key: string]: unknown;
  };
  roots?: {
    listChanged?: boolean;
    [key: string]: unknown;
  };
}

export type Implementation = {
  name: string;
  version: string;
  title: string;
}

export type ServerCapabilities = {
  prompts?: {
    listChanged?: boolean;
    [key: string]: unknown;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
    [key: string]: unknown;
  };
  tools?: {
    listChanged?: boolean;
    [key: string]: unknown;
  };
}

export type InitializeRequest = Request & {
  method: string;
  params: {
    clientInfo: Implementation;
    capabilities: ClientCapabilities;
    protocolVersion?: string;
  };
}

export type InitializeResult = Result & {
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: Implementation;
  instructions?: string;
}

export function isInitializeResult(obj: any): obj is InitializeResult {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.protocolVersion === 'string' &&
    typeof obj.capabilities === 'object' &&
    obj.capabilities !== null &&
    typeof obj.serverInfo === 'object' &&
    obj.serverInfo !== null &&
    typeof obj.serverInfo.name === 'string' &&
    typeof obj.serverInfo.version === 'string' &&
    typeof obj.serverInfo.title === 'string' &&
    (obj.instructions === undefined || typeof obj.instructions === 'string')
  );
}

export type Tool = {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };
}

export type ToolResult = {
  content: Array<{
    type: 'text';
    text: string;
  } | {
    type: 'resource_link';
    uri: string;
    name: string;
    mimeType?: string;
    description?: string;
  }>;
}

export type JSONRPCError = {
  jsonrpc: "2.0";
  id: RequestId;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// 型ガード関数
export function isJSONRPCRequest(obj: any): obj is JSONRPCRequest {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.jsonrpc === '2.0' &&
    (typeof obj.id === 'string' || typeof obj.id === 'number') &&
    typeof obj.method === 'string'
  );
}

export function isJSONRPCResponse(obj: any): obj is JSONRPCResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.jsonrpc === '2.0' &&
    (typeof obj.id === 'string' || typeof obj.id === 'number') &&
    (obj.result !== undefined || obj.error !== undefined)
  );
}

export function isJSONRPCNotification(obj: any): obj is JSONRPCNotification {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.jsonrpc === '2.0' &&
    typeof obj.method === 'string' &&
    obj.id === undefined
  );
}

export function isJSONRPCError(obj: any): obj is JSONRPCError {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.code === 'number' &&
    typeof obj.message === 'string'
  );
}

export function isTool(obj: any): obj is Tool {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    obj.inputSchema &&
    typeof obj.inputSchema === 'object' &&
    obj.inputSchema.type === 'object'
  );
}

export function isToolResult(obj: any): obj is ToolResult {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.content) &&
    obj.content.every((item: any) =>
      (item.type === 'text' && typeof item.text === 'string') ||
      (item.type === 'resource_link' && typeof item.uri === 'string' && typeof item.name === 'string')
    )
  );
}

export enum ErrorCode {
  // SDK error codes
  ConnectionClosed = -32000,
  RequestTimeout = -32001,

  // Standard JSON-RPC error codes
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}

export class McpError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(`MCP error ${code}: ${message}`);
    this.name = "McpError";
  }
}