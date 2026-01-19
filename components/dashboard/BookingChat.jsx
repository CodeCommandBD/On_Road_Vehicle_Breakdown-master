"use client";

import {
  Send,
  Wrench,
  MessageSquare,
  X,
  User,
  Check,
  CheckCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export default function BookingChat({
  bookingId,
  recipientId,
  currentUserId,
  recipientName,
}) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Find or create conversation
  const { data: conversationId, isLoading: isInitLoading } = useQuery({
    queryKey: ["conversation", bookingId, recipientId],
    queryFn: async () => {
      const res = await axiosInstance.post("/messages", {
        recipientId,
        text: "---CHAT_INIT---",
        bookingId,
      });
      return res.data.conversationId;
    },
    enabled: isOpen && !!bookingId && !!recipientId,
  });

  // 2. Fetch Messages
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/chat/${bookingId}`);
      // Filter out the init token if present
      const filteredMessages = (res.data.messages || []).filter(
        (m) => m.text !== "---CHAT_INIT---",
      );
      return filteredMessages;
    },
    enabled: !!conversationId,
    refetchInterval: 3000, // Modernized polling
    onSuccess: () => {
      scrollToBottom();
    },
  });

  const messages = messagesData || [];
  const loading =
    isInitLoading || (isOpen && !!conversationId && isMessagesLoading);

  const sendMutation = useMutation({
    mutationFn: async (text) => {
      const res = await axiosInstance.post("/messages", {
        recipientId,
        text,
        bookingId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["messages", conversationId], (old) => [
        ...(old || []),
        data.messageData,
      ]);
      scrollToBottom();
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMutation.isPending) return;
    const text = newMessage;
    setNewMessage("");
    sendMutation.mutate(text);
  };

  const sending = sendMutation.isPending;

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
            <Wrench className="w-8 h-8 animate-spin text-indigo-500" />
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
              <Wrench className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
