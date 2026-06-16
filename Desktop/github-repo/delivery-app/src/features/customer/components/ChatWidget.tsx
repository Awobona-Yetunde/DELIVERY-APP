import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../../store/authStore";

interface Message {
  type: string;
  user_id: string;
  first_name: string;
  role: string;
  text: string;
  timestamp: string;
}

export default function ChatWidget({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [closed, setClosed] = useState(false);
  const [closedReason, setClosedReason] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !orderId) return;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      console.log("Connecting with token:", token?.slice(0, 30) + "...");
      console.log("Order ID:", orderId);
      setConnectionError("");

      const ws = new WebSocket(
        `ws://147.182.208.195:8000/tracking/chat/${orderId}?token=${token}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) {
          console.log("Chat WebSocket connected ✅");
          setConnected(true);
        }
      };

      ws.onmessage = (e) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(e.data);
          if (data.type === "history") {
            setMessages(data.messages ?? []);
          } else if (data.type === "message") {
            setMessages((prev) => [...prev, data]);
          } else if (data.type === "chat_closed") {
            setClosed(true);
            setClosedReason(data.reason ?? "Chat ended.");
          } else if (data.type === "error") {
            setConnectionError(data.message);
          }
        } catch {}
      };

      ws.onerror = (e) => {
        console.log("Chat WebSocket error:", e);
      };

      ws.onclose = (e) => {
        if (!isMounted) return;
        console.log(
          "Chat WebSocket closed ❌ code:",
          e.code,
          "reason:",
          e.reason,
        );
        setConnected(false);
        if (e.code === 4001) {
          setClosed(true);
          setClosedReason("Session expired. Please log out and log back in.");
        } else if (e.code === 4003) {
          setClosed(true);
          setClosedReason(
            "Chat is only available once a driver accepts your order.",
          );
        } else if (e.code === 4004) {
          setClosed(true);
          setClosedReason("Order not found.");
        } else if (e.code === 1000) {
          setClosed(true);
          setClosedReason("Delivery completed. Chat is closed.");
        } else if (!closed) {
          // Unexpected close — retry
          setTimeout(connect, 3000);
        }
      };
    };

    const timer = setTimeout(connect, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [orderId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setConnectionError("Not connected. Please wait...");
      return;
    }
    if (text.length > 500) {
      setConnectionError("Message too long. Max 500 characters.");
      return;
    }
    wsRef.current.send(JSON.stringify({ text }));
    setInput("");
    setConnectionError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-end justify-end p-4"
      style={{ zIndex: 99999 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Chat panel */}
      <div
        className="relative w-full max-w-sm bg-surface border border-white/10 rounded-2xl
          shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "460px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full shrink-0
              ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
            />
            <p className="text-light text-sm font-semibold">Chat with driver</p>
            <span className="text-muted text-[10px]">
              {connected ? "Connected" : "Connecting..."}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center
              text-muted hover:text-light cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && !closed && connected && (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-muted text-xs">No messages yet. Say hello!</p>
            </div>
          )}

          {!connected && !closed && (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-muted text-xs">Connecting to chat...</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div
                key={i}
                className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
              >
                {!isMe && (
                  <p className="text-muted text-[10px] px-1 capitalize">
                    {msg.first_name} · {msg.role}
                  </p>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${
                    isMe
                      ? "bg-accent text-surface rounded-br-md"
                      : "bg-primary/50 text-light rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-muted text-[10px] px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
          })}

          {closed && (
            <div className="text-center py-4 bg-primary/20 rounded-xl px-3">
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-muted text-xs">{closedReason}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Connection error */}
        {connectionError && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 shrink-0">
            <p className="text-red-400 text-xs">{connectionError}</p>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-white/5 px-3 py-3">
          {closed ? (
            <p className="text-center text-muted text-xs py-1">
              Chat is closed
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={connected ? "Type a message..." : "Connecting..."}
                disabled={!connected}
                maxLength={500}
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 h-9
                  text-sm text-light outline-none focus:border-accent transition-colors
                  placeholder:text-muted/50 disabled:opacity-40"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !connected}
                className="w-9 h-9 bg-accent text-surface rounded-xl flex items-center
                  justify-center font-bold disabled:opacity-40 cursor-pointer
                  hover:bg-amber-400 transition-colors shrink-0 text-sm"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
