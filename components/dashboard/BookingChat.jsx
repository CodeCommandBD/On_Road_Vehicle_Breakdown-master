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
    <div className="fixed bottom-8 right-8 w-96 h-[500px] bg-[#1E1E1E] border border-white/10 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="p-4 bg-orange-500 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
            {recipientName?.charAt(0) || "G"}
          </div>
          <div>
            <p className="font-bold text-sm">
              {recipientName || "Service Provider"}
            </p>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">
              Direct Support
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#161616]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs">Connecting to secure chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-20">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-sm">
              Start a conversation about your breakdown service.
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
                  className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                    isMine
                      ? "bg-orange-500 text-white rounded-tr-none"
                      : "bg-white/5 text-white/80 border border-white/5 rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-40">
                    <span className="text-[8px]">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMine &&
                      (msg.isRead ? (
                        <CheckCheck className="w-3 h-3 text-blue-400" />
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
        className="p-4 bg-[#1E1E1E] border-t border-white/10"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Describe your issue..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
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
