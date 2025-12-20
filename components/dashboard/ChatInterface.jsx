"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
  PlusCircle,
  MessageSquare,
  X,
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
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [recipients, setRecipients] = useState({
    support: [],
    garages: [],
    customers: [],
    searchResult: [],
  });
  const [fetchingRecipients, setFetchingRecipients] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const messagesEndRef = useRef(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchConversations();
    const convInterval = setInterval(fetchConversations, 5000); // Poll list every 5s
    return () => clearInterval(convInterval);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);

      // Real-time polling for messages in active chat
      const msgInterval = setInterval(() => {
        pollNewMessages(activeConversation._id);
      }, 3000); // Poll messages every 3s

      return () => clearInterval(msgInterval);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (conversations.length > 0) {
      const chatType = searchParams.get("chat");
      const chatId = searchParams.get("chatId");

      if (chatId) {
        const targetConv = conversations.find((c) => c._id === chatId);
        if (targetConv) {
          setActiveConversation(targetConv);
        }
      } else if (chatType === "support") {
        const supportConv = conversations.find((c) =>
          c.participants.some((p) => p.role === "admin")
        );
        if (supportConv) {
          setActiveConversation(supportConv);
        } else {
          // If no existing support chat, open the modal and fetch recipients
          setShowNewChatModal(true);
          fetchRecipients();
        }
      }
    }
  }, [conversations, searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async (search = "") => {
    try {
      setFetchingRecipients(true);
      const url = search
        ? `/api/messages/recipients?search=${encodeURIComponent(search)}`
        : "/api/messages/recipients";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecipients(data.recipients);
      }
    } catch (error) {
      toast.error("Failed to load recipients");
    } finally {
      setFetchingRecipients(false);
    }
  };

  useEffect(() => {
    if (showNewChatModal) {
      const delayDebounceFn = setTimeout(() => {
        fetchRecipients(recipientSearch);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [recipientSearch, showNewChatModal]);

  const startNewChat = async (recipient) => {
    // Check if conversation already exists
    const existing = conversations.find((c) =>
      c.participants.some((p) => p._id === recipient._id)
    );

    if (existing) {
      setActiveConversation(existing);
      setShowNewChatModal(false);
      return;
    }

    // Create a "virtual" conversation to show in UI immediately
    const virtualConv = {
      _id: "new-" + recipient._id,
      participants: [{ _id: userId }, recipient],
      isNew: true,
    };

    setActiveConversation(virtualConv);
    setMessages([]);
    setShowNewChatModal(false);
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

  const pollNewMessages = async (id) => {
    if (messages.length === 0) return;

    // Get timestamp of last message
    const lastMsgTime = messages[messages.length - 1].createdAt;

    try {
      const res = await fetch(
        `/api/messages/${id}?since=${encodeURIComponent(lastMsgTime)}`
      );
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        // Only append messages that aren't already in the list (sanity check)
        const newOnes = data.messages.filter(
          (nm) => !messages.find((m) => m._id === nm._id)
        );
        if (newOnes.length > 0) {
          setMessages((prev) => [...prev, ...newOnes]);
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const messageText = newMessage;
    setNewMessage("");

    const recipient = activeConversation.participants.find(
      (p) => p._id !== userId
    );

    // Optimistic Update
    const tempId = "temp-" + Date.now();
    const optimisticMsg = {
      _id: tempId,
      text: messageText,
      sender: userId,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      setSending(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient._id,
          text: messageText,
          bookingId: activeConversation.booking,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Replace optimistic message with actual data
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? data.messageData : m))
        );
        fetchConversations(); // Sync sidebar
      }
    } catch (error) {
      toast.error("Failed to send message");
      // Remove failed message
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setNewMessage(messageText); // Restore input
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
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            onClick={() => {
              setShowNewChatModal(true);
              fetchRecipients();
            }}
            className="p-2.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition-all"
            title="Start New Chat"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
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

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1A1A1A]">
              <div>
                <h3 className="text-xl font-bold text-white">Start New Chat</h3>
                <p className="text-xs text-white/40">
                  Select someone to message
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setRecipientSearch("");
                }}
                className="text-white/40 hover:text-white"
              >
                <X />
              </button>
            </div>

            <div className="p-4 bg-[#1E1E1E] border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Search Results */}
              {recipientSearch.length > 2 && (
                <div>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest px-2 mb-3">
                    Search Results
                  </h4>
                  <div className="space-y-2">
                    {fetchingRecipients ? (
                      <div className="p-4 text-center">
                        <Loader2 className="animate-spin mx-auto w-5 h-5 text-orange-500" />
                      </div>
                    ) : recipients.searchResult?.length > 0 ? (
                      recipients.searchResult.map((u) => (
                        <button
                          key={u._id}
                          onClick={() => startNewChat(u)}
                          className="w-full p-3 flex items-center gap-4 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                        >
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                            <User size={18} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-white text-sm">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider">
                              {u.role}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-white/40 text-xs px-2 italic">
                        No users found for "{recipientSearch}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Support Section */}
              {!recipientSearch && (
                <div>
                  <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest px-2 mb-3">
                    Support Team
                  </h4>
                  <div className="space-y-2">
                    {fetchingRecipients && !recipientSearch ? (
                      <div className="p-4 text-center">
                        <Loader2 className="animate-spin mx-auto w-5 h-5 text-orange-500" />
                      </div>
                    ) : recipients.support?.length > 0 ? (
                      recipients.support.map((admin) => (
                        <button
                          key={admin._id}
                          onClick={() => startNewChat(admin)}
                          className="w-full p-3 flex items-center gap-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                        >
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                            <User />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-white text-sm">
                              {admin.name}
                            </p>
                            <p className="text-[10px] text-orange-500 font-bold uppercase">
                              Official Support
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-white/40 text-xs px-2 italic">
                        Support offline
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Customers Section (For Garages) */}
              {!recipientSearch && recipients.customers?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest px-2 mb-3">
                    My Customers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recipients.customers.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => startNewChat(user)}
                        className="p-3 flex items-center gap-3 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                          {user.name?.charAt(0)}
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-bold text-white text-xs truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-white/40 truncate">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Garages Section (For Users) */}
              {!recipientSearch && recipients.garages?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest px-2 mb-3">
                    Verified Garages
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recipients.garages.map((garage) => (
                      <button
                        key={garage._id}
                        onClick={() => startNewChat(garage)}
                        className="p-3 flex items-center gap-3 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs">
                          {garage.name?.charAt(0)}
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-bold text-white text-xs truncate">
                            {garage.name}
                          </p>
                          <p className="text-[10px] text-white/40 truncate">
                            Verified Mechanical Support
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
