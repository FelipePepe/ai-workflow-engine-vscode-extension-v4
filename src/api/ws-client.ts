import WebSocket from "ws";

export type WsEventHandler = (event: Record<string, unknown>) => void;

export class EngineWebSocketClient {
  private socket?: WebSocket;

  constructor(
    private readonly websocketBaseUrl: string,
    private readonly runId: string,
    private readonly onEvent: WsEventHandler,
    private readonly onStatus: (status: string) => void
  ) {}

  connect(): void {
    const url = `${this.websocketBaseUrl}/ws/runs/${this.runId}`;
    this.socket = new WebSocket(url);

    this.socket.on("open", () => {
      this.onStatus(`Connected to ${url}`);
      this.socket?.send("hello");
    });

    this.socket.on("message", (data) => {
      try {
        const event = JSON.parse(data.toString()) as Record<string, unknown>;
        this.onEvent(event);
      } catch {
        this.onEvent({
          type: "raw",
          message: data.toString()
        });
      }
    });

    this.socket.on("close", () => {
      this.onStatus("WebSocket closed");
    });

    this.socket.on("error", (error) => {
      this.onStatus(`WebSocket error: ${error.message}`);
    });
  }

  dispose(): void {
    this.socket?.close();
    this.socket = undefined;
  }
}
