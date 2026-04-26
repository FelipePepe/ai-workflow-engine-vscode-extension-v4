import WebSocket from "ws";

export type WsEventHandler = (event: Record<string, unknown>) => void;

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY_MS = 1000;

export class EngineWebSocketClient {
  private socket?: WebSocket;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

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
      this.reconnectAttempts = 0;
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

    this.socket.on("close", (code: number) => {
      if (this.disposed || code === 1000) {
        return;
      }
      if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this.reconnectAttempts++;
        const delay = RECONNECT_BASE_DELAY_MS * 2 ** (this.reconnectAttempts - 1);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      } else {
        this.onStatus("disconnected");
      }
    });

    this.socket.on("error", (error) => {
      this.onStatus(`WebSocket error: ${error.message}`);
    });
  }

  dispose(): void {
    this.disposed = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
    }
    this.socket?.close();
    this.socket = undefined;
  }
}
