import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

/** ------------------------------------------------------------------
 * Domain types
 * ------------------------------------------------------------------*/
export type ChatMsg = {
  id: string;
  from: "me" | "server";
  text: string;
  user: string;
};

/** ------------------------------------------------------------------
 * WebSocket hook (30‑sec periodic reconnect)
 * ------------------------------------------------------------------*/
function useChatSocket(onMessage: (m: ChatMsg) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  const connect = () => {
    wsRef.current = new WebSocket(import.meta.env.VITE_WS_URL);

    wsRef.current.addEventListener("open", () => {
      console.info("🔌 WebSocket connected");
    });
    wsRef.current.addEventListener("message", (ev) => {
      onMessage({
        id: crypto.randomUUID(),
        from: "server",
        text: ev.data,
        user: "Server",
      });
    });
    wsRef.current.addEventListener("close", () => {
      console.warn("WebSocket closed – scheduling reconnect");
    });
    wsRef.current.addEventListener("error", (e) => {
      console.error("WebSocket error", e);
    });
  };

  useEffect(() => {
    connect();
    reconnectTimer.current = window.setInterval(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) ws.close(1000, "periodic");
      connect();
    }, 30_000);

    return () => {
      wsRef.current?.close();
      reconnectTimer.current && clearInterval(reconnectTimer.current);
    };
  }, []);

  const send = (msg: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(msg);
  };

  return { send };
}

/** ------------------------------------------------------------------
 * Presentational components
 * ------------------------------------------------------------------*/
const ChatHeader = () => (
  <header className="flex item-col w-screen text-xl font-semibold mb-4 text-center">Scala Chat</header>
);

const ChatMessage = ({ msg }: { msg: ChatMsg }) => {
  const isMe = msg.from === "me";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-2 flex ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[75%] items-end ${
          isMe ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`text-xs text-gray-500 ${isMe ? "ml-2" : "mr-2"}`}
        >
          {msg.user}
        </div>
        <div
          className={`rounded-xl px-4 py-2 whitespace-pre-wrap shadow text-sm break-words ${
            isMe
              ? "bg-blue-500 text-white rounded-br-none"
              : "bg-gray-200 text-gray-800 rounded-bl-none"
          }`}
        >
          {msg.text}
        </div>
      </div>
    </motion.div>
  );
};

const MessageList = ({ list }: { list: ChatMsg[] }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [list]);
  return (
    <div className="flex-1 overflow-y-auto px-2 space-y-2 overflow-y-auto">
      {list.map((m) => (
        <ChatMessage key={m.id} msg={m} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

const ChatInput = ({ onSend }: { onSend: (txt: string) => void }) => {
  const [draft, setDraft] = useState("");
  const handleSend = () => {
    if (draft.trim()) {
      onSend(draft.trim());
      setDraft("");
    }
  };
  return (
    <div className="mt-3 flex items-center space-x-2 resize-none">
      <textarea
        className="w-full rounded-2xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // 👉 Shift + Enter で送信
          if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Aa"
      />
      <button className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 active:bg-blue-800 whitespace-nowrap"
      onClick={handleSend}>
        送信
      </button>
    </div>
  );
};

const ChatMetaPanel = ({ user }: { user: string }) => (
  <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
    <span className="italic">Connected as:</span>
    <span className="font-semibold">{user}</span>
  </div>
);

/** ------------------------------------------------------------------
 * Main container component
 * ------------------------------------------------------------------*/
export default function ChatApp() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const user = "User";
  const { send } = useChatSocket((m) => setMessages((prev) => [...prev, m]));
    
  useEffect(() => {
    // 初期表示時に過去ログを取得
    fetch("/api/logs") // ← ここを適宜調整
      .then((res) => res.json())
      .then((data: ChatMsg[]) => {
        setMessages(data);
      })
      .catch((err) => {
        console.error("過去ログ取得失敗:", err);
      });
  }, []);
  

  const handleSend = (txt: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        from: "me",
        text: txt,
        user: user,
      },
    ]);
    send(txt);
  };

  return (
    <div className="mx-auto w-full h-[90vh]  flex flex-col p-4">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white rounded-2xl shadow p-4 border border-gray-200">
        <ChatMetaPanel user={user} />
        <MessageList list={messages} />
        
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
}
