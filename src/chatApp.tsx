import  { useState, useEffect, useRef } from "react";

function ChatApp() {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // WebSocket接続
    const socket = new WebSocket(
        "wss://function-festival-chat-production.up.railway.app/chat"
    );
    socketRef.current = socket;

    // メッセージ受信時
    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, { from: "server", text: event.data }]);
    };

    // クリーンアップ
    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(input);
      setMessages((prev) => [...prev, { from: "me", text: input }]);
      setInput("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Scala Chat</h2>
      <div style={{ border: "1px solid gray", padding: 10, height: 200, overflowY: "scroll" }}>
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
