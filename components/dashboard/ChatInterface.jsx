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
  Wrench,
  Inbox,
  PlusCircle,
  MessageSquare,
  X,
  Check,
  CheckCheck,
  Download,
  ChevronLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatDateTime } from "@/lib/utils/helpers";

const NOTIFICATION_SOUND_URL =
  "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";

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
  const messagesRef = useRef(messages);
  const lastPollTimeRef = useRef(null);
  const [mobileView, setMobileView] = useState("list"); // 'list' or 'chat'
  const searchParams = useSearchParams();

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
          setMobileView("chat");
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
    setMobileView("chat");
  };

  const fetchMessages = async (id) => {
    try {
      const res = await fetch(`/api/messages/${id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        lastPollTimeRef.current = data.serverTime;
      }
    } catch (error) {
      toast.error("Failed to load messages");
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio(NOTIFICATION_SOUND_URL);
      audio.volume = 0.5;
      // Handle browser autoplay policies
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log(
            "Audio playback blocked until user interaction:",
            error.message
          );
        });
      }
    } catch (e) {
      console.warn("Sound play initialization failed:", e);
    }
  };

  const pollNewMessages = async (id) => {
    const currentMessages = messagesRef.current;
    // Use lastPollTime instead of last message time for more accurate status updates
    const since =
      lastPollTimeRef.current ||
      (currentMessages.length > 0
        ? currentMessages[currentMessages.length - 1].createdAt
        : null);
    if (!since) return;

    try {
      const res = await fetch(
        `/api/messages/${id}?since=${encodeURIComponent(since)}`
      );
      const data = await res.json();
      if (data.success && (data.messages.length > 0 || data.serverTime)) {
        // Update last poll time even if no messages (to keep it fresh)
        if (data.serverTime) lastPollTimeRef.current = data.serverTime;

        if (data.messages.length > 0) {
          setMessages((prev) => {
            let updatedPrev = [...prev];
            const newOnes = [];

            data.messages.forEach((nm) => {
              // 1. Try to find by real ID
              let existingIndex = updatedPrev.findIndex(
                (m) => m._id === nm._id
              );

              // 2. If not found, try to find an optimistic message that matches this one
              if (existingIndex === -1) {
                existingIndex = updatedPrev.findIndex(
                  (m) =>
                    m.isOptimistic &&
                    m.text === nm.text &&
                    m.sender === nm.sender
                );
              }

              if (existingIndex !== -1) {
                // Update or Replace (if it was optimistic)
                updatedPrev[existingIndex] = nm;
              } else {
                // Truly new message (e.g. from other user)
                newOnes.push(nm);
              }
            });

            if (
              newOnes.length === 0 &&
              updatedPrev.every((m, i) => m === prev[i])
            ) {
              return prev;
            }

            // If any truly new messages were from someone else, play sound
            const hasIncoming = newOnes.some((m) => m.sender !== userId);
            if (hasIncoming) playNotificationSound();

            return [...updatedPrev, ...newOnes];
          });
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

  const handleExportChat = () => {
    if (!messages.length) return toast.error("No messages to export");

    const recipient = activeConversation.participants.find(
      (p) => p._id !== userId
    );
    const content = messages
      .map((m) => {
        const sender = m.sender === userId ? "Me" : recipient?.name || "User";
        const time = new Date(m.createdAt).toLocaleString();
        return `[${time}] ${sender}: ${m.text}`;
      })
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `chat_history_${recipient?.name || "user"}.txt`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Wrench className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] overflow-hidden h-[calc(100vh-220px)] sm:h-[calc(100vh-280px)] flex shadow-2xl backdrop-blur-xl relative">
      {/* Sidebar: Conversations List */}
      <div
        className={`${
          mobileView === "chat" ? "hidden" : "flex"
        } lg:flex w-full lg:w-1/3 border-r border-white/5 flex-col bg-[#020617]/50 backdrop-blur-md h-full`}
      >
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Scan frequencies..."
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
            />
          </div>
          <button
            onClick={() => {
              setShowNewChatModal(true);
              fetchRecipients();
            }}
            className="p-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all border border-indigo-500/20"
            title="Secure Link"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length > 0 ? (
            conversations.map((conv) => {
              const recipient = conv.participants.find(
                (p) => p._id === (userId?._id || userId)
              );
              const isActive = activeConversation?._id === conv._id;
              const unreadCount = conv.unreadCount?.[userId] || 0;

              return (
                <button
                  key={conv._id}
                  onClick={() => {
                    setActiveConversation(conv);
                    setMobileView("chat");
                    // Clear unread locally
                    setConversations((prev) =>
                      prev.map((c) =>
                        c._id === conv._id
                          ? {
                              ...c,
                              unreadCount: { ...c.unreadCount, [userId]: 0 },
                            }
                          : c
                      )
                    );
                  }}
                  className={`w-full p-5 flex items-center gap-4 transition-all hover:bg-white/10 relative group ${
                    isActive
                      ? "bg-indigo-500/10 border-r-2 border-indigo-500/50"
                      : ""
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black shrink-0 relative border border-white/5 group-hover:scale-105 transition-transform">
                    {recipient?.avatar ? (
                      <img
                        src={recipient.avatar}
                        alt=""
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      recipient?.name?.charAt(0) || <User />
                    )}

                    {/* Online Status Dot */}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#020617] rounded-full shadow-lg shadow-green-500/20"></span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p
                        className={`font-black tracking-tight text-sm uppercase transition-colors ${
                          isActive ? "text-indigo-400" : "text-slate-200"
                        } truncate`}
                      >
                        {recipient?.name || "Target Identified"}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {new Date(
                            conv.lastMessage.createdAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate flex-1 font-medium ${
                          unreadCount > 0
                            ? "text-white font-bold"
                            : "text-slate-500"
                        }`}
                      >
                        {conv.lastMessage?.text || "Synchronizing channel..."}
                      </p>
                      {unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-full min-w-5 text-center shadow-lg shadow-indigo-600/30 animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4 opacity-40">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                <Inbox className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                Silence on the wire
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`${
          mobileView === "list" ? "hidden" : "flex"
        } lg:flex flex-1 flex flex-col bg-black/20 h-full`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#020617]/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView("list")}
                  className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/20 shadow-lg shadow-indigo-500/5 transition-transform">
                  {(
                    activeConversation.participants.find(
                      (p) => p._id !== (userId?._id || userId)
                    )?.name || "T"
                  ).charAt(0)}
                </div>
                <div>
                  <p className="font-black text-white uppercase tracking-tight text-sm sm:text-base">
                    {activeConversation.participants.find(
                      (p) => p._id !== (userId?._id || userId)
                    )?.name || "Classified Intel"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-glow-green"></span>
                    <p className="text-[10px] text-green-500/70 font-black uppercase tracking-[0.2em]">
                      Live Channel
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExportChat}
                  className="p-3 text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xl border border-white/5"
                  title="Archive Comms"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button className="p-3 text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xl border border-white/5">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {messages.map((msg, i) => {
                const isMine = msg.sender === (userId?._id || userId);
                return (
                  <div
                    key={msg._id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] p-5 rounded-[1.5rem] shadow-xl ${
                        isMine
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/10"
                          : "bg-slate-800/60 text-slate-200 border border-white/5 rounded-tl-none shadow-white/5"
                      }`}
                    >
                      <p className="text-xs sm:text-sm leading-relaxed font-medium">
                        {msg.text}
                      </p>
                      <div className="flex items-center justify-between gap-3 mt-3">
                        <p
                          className={`text-[10px] font-black uppercase tracking-widest ${
                            isMine ? "text-white/60" : "text-slate-500"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {isMine && !msg.isOptimistic && (
                          <div
                            className={
                              msg.isRead ? "text-white" : "text-white/40"
                            }
                          >
                            {msg.isRead ? (
                              <CheckCheck
                                size={14}
                                className="text-indigo-300"
                              />
                            ) : (
                              <Check size={14} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-8 bg-[#020617]/50 border-t border-white/5 backdrop-blur-md"
            >
              <div className="max-w-4xl mx-auto flex items-center gap-4">
                <button
                  type="button"
                  className="p-4 text-slate-500 hover:text-white transition-all bg-white/5 rounded-2xl border border-white/5"
                >
                  <Paperclip className="w-6 h-6" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Input combat log..."
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-600 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 sm:p-2 text-slate-500 hover:text-white"
                  >
                    <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-glow-indigo active:scale-95 border border-indigo-400/20"
                >
                  {sending ? (
                    <Wrench className="w-6 h-6 animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8">
            <div className="w-32 h-32 bg-indigo-500/5 rounded-full flex items-center justify-center border border-indigo-500/10 shadow-inner group">
              <MessageSquare className="w-16 h-16 text-indigo-500 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">
                Channel Standby
              </h2>
              <p className="text-slate-500 max-w-xs font-medium leading-relaxed">
                Awaiting mission signal. Select a verified contact to initialize
                secure communications.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal (Updated Layout) */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#020617] border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_100px_rgba(79,70,229,0.1)]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  Initialize Link
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  Searching User Directory
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setRecipientSearch("");
                }}
                className="text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 bg-[#020617] border-b border-white/5">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Target by name or encrypted email..."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Search Results */}
              {recipientSearch.length > 2 && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] px-2 mb-4">
                    Target Matches
                  </h4>
                  <div className="space-y-3">
                    {fetchingRecipients ? (
                      <div className="p-8 text-center">
                        <Wrench className="animate-spin mx-auto w-8 h-8 text-indigo-500" />
                      </div>
                    ) : recipients.searchResult?.length > 0 ? (
                      recipients.searchResult.map((u) => (
                        <button
                          key={u._id}
                          onClick={() => startNewChat(u)}
                          className="w-full p-4 flex items-center gap-4 rounded-2xl bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                            <User size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-white text-sm uppercase tracking-tight">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                              {u.role} • {u.email?.substring(0, 10)}...
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-slate-600 text-xs px-2 font-bold uppercase tracking-widest py-8 text-center italic">
                        No targets found in current sector.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Support Section */}
              {!recipientSearch && (
                <div>
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] px-2 mb-4">
                    High Command
                  </h4>
                  <div className="space-y-3">
                    {fetchingRecipients && !recipientSearch ? (
                      <div className="p-8 text-center">
                        <Wrench className="animate-spin mx-auto w-8 h-8 text-indigo-500" />
                      </div>
                    ) : recipients.support?.length > 0 ? (
                      recipients.support.map((admin) => (
                        <button
                          key={admin._id}
                          onClick={() => startNewChat(admin)}
                          className="w-full p-4 flex items-center gap-4 rounded-2xl bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <ShieldAlert size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-white text-sm uppercase tracking-tight">
                              {admin.name}
                            </p>
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-0.5">
                              Verified Official
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-slate-600 text-xs px-2 font-black uppercase tracking-widest italic py-4">
                        Support channels secured.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Customers/Garages Section (Universal Grid) */}
              {!recipientSearch &&
                (recipients.customers?.length > 0 ||
                  recipients.garages?.length > 0) && (
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] px-2 mb-4">
                      Linked Assets
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        ...(recipients.customers || []),
                        ...(recipients.garages || []),
                      ].map((user) => (
                        <button
                          key={user._id}
                          onClick={() => startNewChat(user)}
                          className="p-4 flex items-center gap-4 rounded-2xl bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-black text-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">
                            {user.name?.charAt(0)}
                          </div>
                          <div className="text-left min-w-0">
                            <p className="font-black text-white text-sm uppercase tracking-tight truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">
                              {user.role} • Secure Channel
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
