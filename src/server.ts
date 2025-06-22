import { Protocol } from './protocol.js';
import { ClientCapabilities, Implementation, ServerCapabilities, InitializeResult, InitializeRequest, LATEST_PROTOCOL_VERSION, SUPPORTED_PROTOCOL_VERSIONS } from './types.js';

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

        this._capabilities = mergeCapabilities(this._capabilities, capabilities);
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
            capabilities: this.getCapabilities(),
            serverInfo: this._serverInfo,
            ...(this._instructions && { instructions: this._instructions }),
        };
    }
}