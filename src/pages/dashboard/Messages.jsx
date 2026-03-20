import { useState, useRef, useEffect } from "react";
import {
  Search,
  MessageSquare,
  Send,
  MoreVertical,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Plus
} from "lucide-react";
import useDashboardStore, {
  formatDate,
  getRelativeTime,
} from "../../store/useDashboardStore";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";

const Messages = () => {
  const { messages, addMessage } = useDashboardStore();
  const [selectedConversationId, setSelectedConversationId] = useState(
    messages[0]?.id
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConverationList, setShowConversationList] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (!mobile) setShowConversationList(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConversationId, messages]);

  const filteredConversations = messages.filter(
    (conv) => {
      const matchesSearch = conv.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.providerName &&
          conv.providerName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = activeFilter === "all" || conv.type === activeFilter;
      
      return matchesSearch && matchesFilter;
    }
  );

  const selectedConversation = messages.find(c => c.id === selectedConversationId);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    addMessage(selectedConversationId, {
      sender: "customer",
      text: newMessage,
      time: new Date().toISOString(),
    });

    setNewMessage("");
  };

  const selectConversation = (conv) => {
    setSelectedConversationId(conv.id);
    if (isMobileView) {
      setShowConversationList(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-140px)] flex flex-col space-y-4" style={{ height: 'calc(100dvh - 140px)' }}>
      <div className="flex-shrink-0">
        <PageHeader
          title="Messages"
          subtitle="Communicate with support and service providers"
        />
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Conversation List */}
        <div
          className={`
          flex-shrink-0 w-full lg:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden transition-all
          ${isMobileView && !showConverationList ? "hidden" : "flex"}
        `}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Inbox</h2>
              <button className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors group">
                <Plus size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
              {["all", "support", "provider"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`
                    flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize
                    ${
                      activeFilter === filter
                        ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }
                  `}
                >
                  {filter === "all" ? "All" : filter + "s"}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare size={20} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No conversations found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`
                      w-full p-4 flex gap-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 relative
                      ${
                        selectedConversation?.id === conv.id
                          ? "bg-primary-50 dark:bg-primary-900/10"
                          : ""
                      }
                    `}
                  >
                    {selectedConversation?.id === conv.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />
                    )}

                    <div className="relative flex-shrink-0">
                      <Avatar
                        name={conv.providerName || "Support"}
                        size="md"
                        className={!conv.providerName ? "bg-primary-100 text-primary-700" : ""}
                      />
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger-600 border-2 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {conv.providerName || "Support Team"}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {getRelativeTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate mb-1">
                        {conv.subject}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div
          className={`
          flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden
          ${isMobileView && showConverationList ? "hidden" : "flex"}
        `}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMobileView && (
                    <button
                      onClick={() => setShowConversationList(true)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <Avatar
                    name={selectedConversation.providerName || "Support"}
                    size="md"
                    className={
                      !selectedConversation.providerName
                        ? "bg-primary-100 text-primary-700"
                        : ""
                    }
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedConversation.providerName || "Support Team"}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-[11px] text-slate-500">Online</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Phone size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Video size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Info size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 dark:bg-slate-950/20 custom-scrollbar"
              >
                <div className="flex justify-center">
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                    {formatDate(selectedConversation.chatLog[0].time, "long")}
                  </span>
                </div>

                {selectedConversation.chatLog.map((chat, idx) => {
                  const isMe = chat.sender === "customer";
                  return (
                    <div
                      key={idx}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${
                          isMe ? "order-1" : "order-2"
                        }`}
                      >
                        <div
                          className={`
                          p-3 px-4 rounded-2xl text-sm
                          ${
                            isMe
                              ? "bg-primary-600 text-white rounded-tr-none"
                              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none"
                          }
                        `}
                        >
                          {chat.text}
                        </div>
                        <p
                          className={`text-[10px] text-slate-400 mt-1 ${
                            isMe ? "text-right" : "text-left"
                          }`}
                        >
                          {formatDate(chat.time, "time")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      <Paperclip size={20} />
                    </button>
                    <button
                      type="button"
                      className="hidden sm:block p-2 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      <ImageIcon size={20} />
                    </button>
                  </div>

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 active:scale-95 transition-all outline-none"
                    >
                      <Smile size={18} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`
                      p-2.5 rounded-xl transition-all shadow-lg active:scale-95
                      ${
                        newMessage.trim()
                          ? "bg-primary-600 text-white shadow-primary-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      }
                    `}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-slate-950/20">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-6 animate-bounce">
                <MessageSquare size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Your Messages
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Select a conversation from the list to start messaging with
                support or service providers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
