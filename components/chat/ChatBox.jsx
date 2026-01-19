"use client";
import { useState, useEffect, useRef } from "react";
import { pusherClient } from "@/lib/pusher";
import { formatDistanceToNow } from "date-fns";
import axiosInstance from "@/lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ChatBox({ conversationId, recipientId, currentUser }) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch History
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chatMessages", conversationId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/messages/${conversationId}`);
      return res.data.messages || [];
    },
    enabled: !!conversationId,
  });

  // 2. Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      const res = await axiosInstance.post("/api/messages", {
        recipientId,
        text,
      });
      return res.data;
    },
    onSuccess: () => {
      setNewMessage("");
      setIsTyping(false);
      queryClient.invalidateQueries({
        queryKey: ["chatMessages", conversationId],
      });
    },
    onError: () => toast.error("Failed to send message"),
  });

  const typingMutation = useMutation({
    mutationFn: async (isTyping) => {
      await axiosInstance.post("/api/messages/typing", {
        conversationId,
        isTyping,
      });
    },
  });

  // Real-time: Subscribe to conversation channel
  useEffect(() => {
    if (!conversationId || !pusherClient) return;

    const channel = pusherClient.subscribe(`conversation-${conversationId}`);

    // Listen for new messages
    channel.bind("new-message", (data) => {
      // Manual cache update for real-time smoothness
      queryClient.setQueryData(["chatMessages", conversationId], (old) => {
        if (!old) return [data.message];
        if (old.some((m) => m._id === data.message._id)) return old;
        return [...old, data.message];
      });
      scrollToBottom();
    });

    // Listen for typing indicators
    channel.bind("typing", (data) => {
      if (data.userId !== currentUser?._id) {
        setRecipientTyping(data.isTyping);

        // Auto-hide typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => setRecipientTyping(false), 3000);
        }
      }
    });

    return () => {
      pusherClient.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId, currentUser]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      typingMutation.mutate(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingMutation.mutate(false);
    }, 3000);
  };

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage =
              msg.sender?._id === currentUser?._id ||
              msg.sender === currentUser?._id;

            return (
              <div
                key={msg._id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {msg.createdAt &&
                      formatDistanceToNow(new Date(msg.createdAt), {
                        addSuffix: true,
                      })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {recipientTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={sendMessage}
        className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
