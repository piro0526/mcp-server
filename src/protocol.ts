import { isJSONRPCResponse, isJSONRPCRequest, isJSONRPCNotification, isJSONRPCError, ErrorCode, McpError, Result, Request, Notification } from './types.js';
import { JSONRPCRequest, JSONRPCResponse, JSONRPCNotification, JSONRPCError} from "./types.js";
import { Transport } from './transport.js';

export abstract class Protocol {

    private _transport?: Transport;
    
    private _requestHandlers: Map<
        string,
        (
            request: JSONRPCRequest
        ) => Promise<Result>
    > = new Map();
    private _notificationHandlers: Map<
        string,
        (
            notification: JSONRPCNotification
        ) => Promise<void>
    > = new Map();
    private _responseHandlers: Map<
        number,
        (response: JSONRPCResponse | Error) => void
    > = new Map();


    constructor(private _options?: ProtocolOptions) {}

    onclose?: () => void;

    onerror?: (error: Error) => void;

    setRequestHandler(
        method: string,
        handler: (request: Request) => Result | Promise<Result>
    ): void {
        this._requestHandlers.set(method, (request) => {
            return Promise.resolve(handler(request));
        });
    }

    setNotificationHandler(
        method: string,
        handler: (notification: Notification) => void | Promise<void>
    ): void {
        this._notificationHandlers.set(method, (request) => {
            return Promise.resolve(handler(request));
        });
    }

    async connect(transport: Transport): Promise<void> {
        // 接続処理の実装
        this._transport = transport;

        this._transport.onclose = () => {
            this._onclose();
        };


        this._transport.onerror = (error: Error) => {
            this._onerror(error);
        };

        this._transport.onmessage = (message) => {
            if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
                this._onresponse(message);
            } else if (isJSONRPCRequest(message)) {
                this._onrequest(message);
            } else if (isJSONRPCNotification(message)) {
                this._onnotification(message);
            } else {
                this._onerror(new Error(`Unknown message type: ${JSON.stringify(message)}`));
            }
        };

        await this._transport.start();
    }


    private _onerror(error: Error): void {
        this.onerror?.(error);
    }

    private _onnotification(notification: JSONRPCNotification): void {
        const handler =
        this._notificationHandlers.get(notification.method)

        // Ignore notifications not being subscribed to.
        if (handler === undefined) {
            return;
        }

        // Starting with Promise.resolve() puts any synchronous errors into the monad as well.
        Promise.resolve()
        .then(() => handler(notification))
        .catch((error) =>
            this._onerror(
            new Error(`Uncaught error in notification handler: ${error}`),
            ),
        );
    }

    private _onclose(): void {
        const responseHandlers = this._responseHandlers;
        this._responseHandlers = new Map();
        this._transport = undefined;
        this.onclose?.();

        const error = new McpError(ErrorCode.ConnectionClosed, "Connection closed");
        for (const handler of responseHandlers.values()) {
            handler(error);
        }
    }

    private _onresponse(response: JSONRPCResponse | JSONRPCError): void {
        const messageId = Number(response.id);
        const handler = this._responseHandlers.get(messageId);
        if (handler === undefined) {
            this._onerror(
                new Error(
                    `Received a response for an unknown message ID: ${JSON.stringify(response)}`,
                ),
            );
            return;
        }

        this._responseHandlers.delete(messageId);

        if (isJSONRPCResponse(response)) {
            handler(response);
        } else {
            const error = new McpError(
                response.error.code,
                response.error.message,
                response.error.data,
            );
            handler(error);
        }
    }

    private _onrequest(request: JSONRPCRequest): void {
        const handler = this._requestHandlers.get(request.method);
        if (handler === undefined) {
            this._transport
                ?.send({
                    jsonrpc: "2.0",
                    id: request.id,
                    error: {
                        code: ErrorCode.MethodNotFound,
                        message: "Method not found",
                    },
                })
                .catch((error) =>
                    this._onerror(
                        new Error(`Failed to send an error response: ${error}`),
                    ),
                );
            return;
        }

        Promise.resolve()
            .then(() => handler(request))
            .then(
                (result) => {
                    return this._transport?.send({
                        result,
                        jsonrpc: "2.0",
                        id: request.id,
                    });
                },
                (error) => {
                    return this._transport?.send({
                        jsonrpc: "2.0",
                        id: request.id,
                        error: {
                            code: Number.isSafeInteger(error["code"])
                                ? error["code"]
                                : ErrorCode.InternalError,
                            message: error.message ?? "Internal error",
                        },
                    });
                },
            )
            .catch((error) =>
                this._onerror(new Error(`Failed to send response: ${error}`)),
            );
    };

    get transport(): Transport | undefined {
        return this._transport;
    }
}
