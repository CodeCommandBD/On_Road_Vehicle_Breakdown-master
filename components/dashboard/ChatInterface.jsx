"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  User,
  MoreVertical,
  Paperclip,
  Smile,
  Clock,
  Loader2,
  Inbox,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatDateTime } from "@/lib/utils/helpers";

export default function ChatInterface({ userId }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await fetch(`/api/messages/${id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error("Failed to load messages");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const recipient = activeConversation.participants.find(
      (p) => p._id !== userId
    );

    try {
      setSending(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient._id,
          text: newMessage,
          bookingId: activeConversation.booking,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.messageData]);
        setNewMessage("");
        fetchConversations(); // Refresh list to update last message
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl overflow-hidden h-[calc(100vh-200px)] flex">
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map((conv) => {
              const recipient = conv.participants.find((p) => p._id !== userId);
              const isActive = activeConversation?._id === conv._id;
              return (
                <button
                  key={conv._id}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full p-4 flex items-center gap-4 transition-colors hover:bg-white/5 ${
                    isActive ? "bg-white/10" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold shrink-0">
                    {recipient?.avatar ? (
                      <img
                        src={recipient.avatar}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      recipient?.name?.charAt(0) || <User />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-white truncate">
                        {recipient?.name || "Unknown"}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-white/40">
                          {new Date(
                            conv.lastMessage.createdAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 truncate italic">
                      {conv.lastMessage?.text || "Started a conversation"}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Inbox className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/40 text-sm">No messages yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#161616]">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1E1E1E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                  {activeConversation.participants
                    .find((p) => p._id !== userId)
                    ?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white">
                    {
                      activeConversation.participants.find(
                        (p) => p._id !== userId
                      )?.name
                    }
                  </p>
                  <p className="text-[10px] text-green-500 font-bold">ONLINE</p>
                </div>
              </div>
              <button className="p-2 text-white/40 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => {
                const isMine = msg.sender === userId;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                        isMine
                          ? "bg-orange-500 text-white rounded-tr-none"
                          : "bg-[#1E1E1E] text-white/80 border border-white/10 rounded-tl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMine ? "text-white/60" : "text-white/40"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-6 bg-[#1E1E1E] border-t border-white/10"
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-[#161616] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-glow-orange"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Select a Conversation
            </h2>
            <p className="text-white/40 max-w-sm">
              Click on a chat to start messaging or view your conversation
              history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper icon
function MessageSquare(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
