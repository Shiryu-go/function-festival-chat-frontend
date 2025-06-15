import { useState, useEffect, useRef } from "react";

type Message = {
  from: "me" | "server";
  text: string;
};

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  const connectWebSocket = () => {
    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, { from: "server", text: event.data }]);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    };

    socket.onerror = (e) => {
      console.error("WebSocket error", e);
    };
  };

  useEffect(() => {
    // 初回接続
    connectWebSocket();

    // 30秒ごとに再接続
    reconnectTimer.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Periodic reconnect");
      }
      connectWebSocket();
    }, 30_000);

    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current !== null) {
        clearInterval(reconnectTimer.current);
      }
    };
  }, []);

  const sendMessage = () => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(input);
      setMessages((prev) => [...prev, { from: "me", text: input }]);
      setInput("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Scala Chat</h2>
      <div
        style={{
          border: "1px solid gray",
          padding: 10,
          height: 200,
          overflowY: "scroll",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx}>
            <b>{msg.from === "me" ? "You" : "Server"}:</b> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatApp;
