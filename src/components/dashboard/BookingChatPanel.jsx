import { useEffect, useRef, useState, useMemo } from "react";
import { Paperclip, Send, AlertCircle, Lock } from "lucide-react";
import useBookingChatStore from "../../store/useBookingChatStore";
import useAuthStore from "../../store/useAuthStore";
import * as svc from "../../services/bookingChatService";
import socketService from "../../services/socketService";
import { NodeURL } from "../../services/api";

/** Tiny relative-time helper (avoids adding dayjs as a dep). */
const relTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${NodeURL}${url}`;
};

/**
 * Booking-scoped chat panel (Point 3 — May 2026).
 *
 * Renders inside BookingDetailDrawer's Chat tab. Shows the message thread,
 * a composer with text + image upload, and disables input when the chat is
 * read-only (booking completed/cancelled).
 *
 * Props:
 *   bookingId — the parent Booking._id (used for all API calls)
 */
export default function BookingChatPanel({ bookingId }) {
  const user = useAuthStore((s) => s.user);
  const chats = useBookingChatStore((s) => s.chats);
  const loading = useBookingChatStore((s) => s.loading);
  const loadChat = useBookingChatStore((s) => s.loadChat);
  const appendMessage = useBookingChatStore((s) => s.appendMessage);
  const markChatRead = useBookingChatStore((s) => s.markChatRead);
  const setActiveBookingId = useBookingChatStore((s) => s.setActiveBookingId);

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  const chat = chats[bookingId];

  useEffect(() => {
    setActiveBookingId(bookingId);
    loadChat(bookingId).then(() => markChatRead(bookingId));
    // Join the chat socket room so live messages from the provider arrive
    // instantly via `booking_chat_message` instead of waiting for the next
    // REST refresh. Backend emits to `chat_<bookingId>` only — without this
    // the panel only sees its own optimistic sends.
    socketService.joinChat(bookingId);
    return () => {
      socketService.leaveChat(bookingId);
      setActiveBookingId(null);
    };
  }, [bookingId, loadChat, markChatRead, setActiveBookingId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat?.messages?.length]);

  // Mark new arrivals as read while panel is open
  useEffect(() => {
    if (!chat?.messages?.length) return;
    markChatRead(bookingId);
  }, [chat?.messages?.length, bookingId, markChatRead]);

  const currentUserId = useMemo(
    () => String(user?._id || user?.id || ""),
    [user]
  );

  if (loading && !chat) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-slate-500 dark:text-slate-400">
        <div className="text-sm">Loading chat…</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Chat will be available once your deposit is paid.
        </p>
      </div>
    );
  }

  const canSend = chat.canSendMessage === true;
  const closedReason = chat.closeReason; // "completed" | "cancelled" | null

  const onSend = async () => {
    const value = draft.trim();
    if (!value || busy || !canSend) return;
    setError("");
    setBusy(true);

    // Optimistic message — append locally first so input clears immediately
    const optimistic = {
      sender: {
        userId: currentUserId,
        userType: "customer",
        name: user?.name || "Customer",
      },
      type: "text",
      content: value,
      attachments: [],
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    appendMessage(bookingId, optimistic);
    setDraft("");

    try {
      const res = await svc.sendMessage(bookingId, {
        type: "text",
        content: value,
      });
      if (!res?.success) throw new Error(res?.message || "Failed to send");
      // Server message appended via socket OR by reload; the optimistic copy
      // is fine to leave (createdAt+sender dedupes future socket echo).
    } catch (err) {
      setError(err?.message || "Failed to send message");
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canSend) return;
    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      const upload = await svc.uploadImage(bookingId, file);
      if (!upload?.success || !upload.data?.url) {
        throw new Error(upload?.message || "Upload failed");
      }
      const res = await svc.sendMessage(bookingId, {
        type: "image",
        content: "",
        attachments: [
          {
            url: upload.data.url,
            mimeType: upload.data.mimeType,
            sizeBytes: upload.data.sizeBytes,
          },
        ],
      });
      if (!res?.success) throw new Error(res?.message || "Failed to send");
      if (res.data?.message) appendMessage(bookingId, res.data.message);
    } catch (err) {
      setError(err?.message || "Failed to upload image");
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const messages = chat.messages || [];

  return (
    <div className="flex flex-col h-full min-h-[480px]">
      {!canSend && closedReason && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5" />
          {closedReason === "completed"
            ? "This booking is complete. Chat is now read-only."
            : "This booking was cancelled. Chat is now read-only."}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50 dark:bg-slate-900/40"
      >
        {messages.length === 0 && (
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((m, i) => {
          const isSystem = m.type === "system" || m.sender?.userType === "system";
          const isSelf = !isSystem && String(m.sender?.userId) === currentUserId;
          if (isSystem) {
            return (
              <div key={i} className="flex justify-center my-2">
                <div className="text-[11px] text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 px-3 py-1 rounded-full max-w-[80%] text-center">
                  {m.content}
                </div>
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                  isSelf
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {!isSelf && m.sender?.name && (
                  <div className="text-[11px] font-semibold opacity-80 mb-0.5">
                    {m.sender.name}
                  </div>
                )}
                {m.type === "image" && m.attachments?.[0]?.url && (
                  <a
                    href={resolveImageUrl(m.attachments[0].url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-1"
                  >
                    <img
                      src={resolveImageUrl(m.attachments[0].url)}
                      alt="attachment"
                      className="rounded-lg max-h-56 max-w-full"
                    />
                  </a>
                )}
                {m.content && m.content !== "[Image]" && (
                  <div className="whitespace-pre-wrap break-words">
                    {m.content}
                  </div>
                )}
                <div
                  className={`text-[10px] mt-1 ${
                    isSelf
                      ? "text-blue-200"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {relTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900 flex gap-2 items-end">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={canSend ? "Type a message…" : "Chat is read-only"}
          disabled={!canSend || busy}
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend || !draft.trim() || busy}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
}
