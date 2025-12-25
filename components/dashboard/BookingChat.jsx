"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  X,
  User,
  Check,
  CheckCheck,
} from "lucide-react";
import { toast } from "react-toastify";

export default function BookingChat({
  bookingId,
  recipientId,
  currentUserId,
  recipientName,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const lastPollTimeRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen && bookingId && recipientId) {
      initChat();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isOpen]);

  const initChat = async () => {
    setLoading(true);
    try {
      // Find or create conversation
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          text: "---CHAT_INIT---", // Special token to just get/create conversation
          bookingId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConversationId(data.conversationId);
        await fetchMessages(data.conversationId);
        startPolling(data.conversationId);
      }
    } catch (error) {
      console.error("Chat init error:", error);
      toast.error("Failed to initialize chat");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`/api/messages/${convId}`);
      const data = await res.json();
      if (data.success) {
        // Filter out the init token if present
        const filteredMessages = data.messages.filter(
          (m) => m.text !== "---CHAT_INIT---"
        );
        setMessages(filteredMessages);
        lastPollTimeRef.current = data.serverTime;
        scrollToBottom();
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    }
  };

  const startPolling = (convId) => {
    stopPolling();
    pollingIntervalRef.current = setInterval(async () => {
      const since = lastPollTimeRef.current;
      if (!since) return;

      try {
        const res = await fetch(
          `/api/messages/${convId}?since=${encodeURIComponent(since)}`
        );
        const data = await res.json();
        if (data.success) {
          lastPollTimeRef.current = data.serverTime;
          if (data.messages.length > 0) {
            const newMessages = data.messages.filter(
              (m) => m.text !== "---CHAT_INIT---"
            );
            if (newMessages.length > 0) {
              setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m._id));
                const uniqueNewOnes = newMessages.filter(
                  (m) => !existingIds.has(m._id)
                );
                if (uniqueNewOnes.length === 0) return prev;
                return [...prev, ...uniqueNewOnes];
              });
              scrollToBottom();
            }
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const text = newMessage;
    setNewMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          text,
          bookingId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.messageData]);
        scrollToBottom();
      }
    } catch (error) {
      toast.error("Failed to send message");
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 p-4 bg-orange-500 text-white rounded-full shadow-2xl shadow-orange-500/40 hover:scale-110 transition-all z-50 flex items-center gap-2"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="font-bold pr-2">Chat with Mechanic</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-96 h-[550px] bg-[#020617] border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 backdrop-blur-xl">
      {/* Header */}
      <div className="p-6 bg-indigo-600 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black border border-white/20">
            {recipientName?.charAt(0) || "G"}
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-tight">
              {recipientName || "Service Provider"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">
                Tactical Comms
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-2 rounded-full transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              Synchronizing...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-20">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">
              Establish connection link
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender === currentUserId;
            return (
              <div
                key={idx}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-lg ${
                    isMine
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-900/80 text-white/90 border border-white/5 rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className="flex items-center justify-end gap-1.5 mt-2 opacity-40">
                    <span className="text-[8px] font-black uppercase">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMine &&
                      (msg.isRead ? (
                        <CheckCheck className="w-3 h-3 text-indigo-300" />
                      ) : (
                        <Check className="w-3 h-3" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-6 bg-[#020617] border-t border-white/5"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Input data..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-glow-indigo active:scale-95"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
