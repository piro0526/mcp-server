import { Protocol } from './protocol.js';
import {
    ClientCapabilities,
    Implementation,
    ServerCapabilities,
    InitializeResult,
    InitializeRequest,
    Request,
    Result,
    LATEST_PROTOCOL_VERSION,
    SUPPORTED_PROTOCOL_VERSIONS,
    Tool
} from './types.js';

export type ServerOptions = {
  /**
   * Capabilities to advertise as being supported by this server.
   */
  capabilities?: ServerCapabilities;

  /**
   * Optional instructions describing how to use the server and its features.
   */
  instructions?: string;
};

export class Server extends Protocol {
    private _clientCapabilities?: ClientCapabilities;
    private _clientVersion?: Implementation;
    private _capabilities: ServerCapabilities;
    private _instructions?: string;
    
    private _registeredTools: { [name: string]: Tool } = {};

    oninitialized?: () => void;

    constructor(
        private _serverInfo: Implementation,
        options?: ServerOptions,
    ) {
        super(options);
        this._capabilities = options?.capabilities || {};
        this._instructions = options?.instructions;

        this.setRequestHandler("initialize", (request) =>
            this._oninitialize(request as InitializeRequest),
        );
        this.setNotificationHandler("notifications/initialized", () =>
            this.oninitialized?.(),
        );
    }

    public registerCapabilities(capabilities: ServerCapabilities): void {
        if (this.transport) {
            throw new Error(
                "Cannot register capabilities after connecting to transport",
            );
        }

        this._capabilities = capabilities;
    }

    private async _oninitialize(
        request: InitializeRequest,
    ): Promise<InitializeResult> {
        const requestedVersion = request.params.protocolVersion;

        this._clientCapabilities = request.params.capabilities;
        this._clientVersion = request.params.clientInfo;

        const protocolVersion = typeof requestedVersion === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
            ? requestedVersion
            : LATEST_PROTOCOL_VERSION;

        return {
            protocolVersion,
            capabilities: this._capabilities,
            serverInfo: this._serverInfo,
            ...(this._instructions && { instructions: this._instructions }),
        };
    }

    private _toolHandlersInitialized = false;

    private setToolRequestHandlers() {
        if (this._toolHandlersInitialized) {
        return;
        }

        this.setRequestHandler(
            "tools/list",
            (): Result => {
                const Result: Result = {
                    tools: Object.values(this._registeredTools),
                };
                return Result;
            }
        );

        this.setRequestHandler(
            "tools/call",
            async (request: Request): Promise<Result> => {
                const toolName = request.params?.name;
                const tool = this._registeredTools[toolName];

                if (!tool) {
                    throw new Error(`Tool '${toolName}' not found`);
                }

                // Validate input against tool's schema
                const input = request.params?.arguments || {};
                if (tool.inputSchema.type !== 'object') {
                    throw new Error(`Tool '${toolName}' requires an object input`);
                }
                if (tool.inputSchema.required) {
                    for (const prop of tool.inputSchema.required) {
                        if (!(prop in input)) {
                            throw new Error(`Missing required property '${prop}' in input for tool '${toolName}'`);
                        }
                    }
                }

                // Call the tool's implementation (this part is abstract and should be implemented by subclasses)
                return await this.callTool(tool, input);
            }
        )
    }
}