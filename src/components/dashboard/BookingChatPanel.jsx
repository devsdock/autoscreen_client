import { useEffect, useRef, useState, useMemo } from "react";
import { Paperclip, FileText, Image as ImageIcon, Send, AlertCircle, Lock, Download } from "lucide-react";
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

/**
 * Force a browser download regardless of origin. The HTML `download`
 * attribute is only honoured for same-origin URLs — anything served
 * from a different host (or via ngrok) falls back to navigation. We
 * fetch the asset as a blob and trigger an anchor click on a blob URL
 * instead, which always downloads. Fallback to direct anchor (with
 * download attr) if fetch fails — covers offline / CORS blocked.
 */
async function forceDownload(url, filename) {
  try {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
const MAX_DOC_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOC_EXT = /\.(pdf|doc|docx|xls|xlsx|txt)$/i;
const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

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
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const fileRef = useRef(null);
  const docRef = useRef(null);
  const scrollRef = useRef(null);
  const attachWrapRef = useRef(null);
  // Typing-indicator emit/throttle. typingActiveRef tracks whether we've
  // already fired chat-typing-start; typingTimerRef debounces stop after
  // 3 s of no further keystrokes. Clean stop on unmount + send.
  const typingActiveRef = useRef(false);
  const typingTimerRef = useRef(null);

  // Close the attach menu when clicking outside it.
  useEffect(() => {
    if (!attachMenuOpen) return;
    const onDocMouseDown = (e) => {
      if (
        attachWrapRef.current &&
        !attachWrapRef.current.contains(e.target)
      ) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [attachMenuOpen]);

  const chat = chats[bookingId];
  // Typing payload received from another participant (provider/staff).
  const typingPayload = useBookingChatStore((s) =>
    bookingId ? s.typingByBooking[String(bookingId)] : null,
  );

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
      // Force-stop typing on unmount so the recipient doesn't see a stale
      // "is typing…" indicator after the customer closes the panel.
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (typingActiveRef.current) {
        typingActiveRef.current = false;
        socketService.sendTyping(bookingId, "stop", {
          userId: String(user?._id || user?.id || ""),
          userType: "customer",
        });
      }
    };
  }, [bookingId, loadChat, markChatRead, setActiveBookingId]);

  // Typing indicator handlers — debounced 3 s. Called from textarea
  // onChange. Idempotent: only fires chat-typing-start once until the
  // 3-second window resets.
  const emitStartTyping = () => {
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      socketService.sendTyping(bookingId, "start", {
        userId: String(user?._id || user?.id || ""),
        userType: "customer",
        name: user?.firstName
          ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
          : user?.name || "Customer",
      });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTypingNow();
    }, 3000);
  };

  const stopTypingNow = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (typingActiveRef.current) {
      typingActiveRef.current = false;
      socketService.sendTyping(bookingId, "stop", {
        userId: String(user?._id || user?.id || ""),
        userType: "customer",
      });
    }
  };

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
    stopTypingNow();

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

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canSend) return;
    setError("");

    const extOk = ALLOWED_DOC_EXT.test(file.name);
    const mimeOk = ALLOWED_DOC_MIMES.includes(file.type);
    if (!extOk && !mimeOk) {
      setError("Only PDF, DOC, DOCX, XLS, XLSX, or TXT files are allowed.");
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setError("File must be 10MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      const upload = await svc.uploadFile(bookingId, file);
      if (!upload?.success || !upload.data?.url) {
        throw new Error(upload?.message || "Upload failed");
      }
      const res = await svc.sendMessage(bookingId, {
        type: "file",
        content: "",
        attachments: [
          {
            url: upload.data.url,
            mimeType: upload.data.mimeType,
            sizeBytes: upload.data.sizeBytes,
            originalFilename: upload.data.originalFilename || file.name,
          },
        ],
      });
      if (!res?.success) throw new Error(res?.message || "Failed to send");
      if (res.data?.message) appendMessage(bookingId, res.data.message);
    } catch (err) {
      setError(err?.message || "Failed to upload file");
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
          // Role accents on non-self bubbles so the customer can tell apart
          // provider and staff messages at a glance when both are in the
          // same conversation. Self bubbles keep the existing primary-blue.
          const senderType = m.sender?.userType;
          const accentBorder =
            senderType === "provider"
              ? "border-l-4 border-l-purple-400"
              : senderType === "staff"
                ? "border-l-4 border-l-emerald-400"
                : "border-l-4 border-l-blue-400";
          const rolePill =
            senderType === "provider"
              ? "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-900/20 dark:border-purple-800/40"
              : senderType === "staff"
                ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800/40"
                : "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-800/40";
          return (
            <div
              key={i}
              className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                  isSelf
                    ? "bg-blue-600 text-white"
                    : `bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 ${accentBorder}`
                }`}
              >
                {!isSelf && (
                  <div className="flex items-center gap-2 mb-1">
                    {m.sender?.name && (
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                        {m.sender.name}
                      </span>
                    )}
                    {senderType ? (
                      <span
                        className={`inline-block px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide rounded border ${rolePill}`}
                      >
                        {/* Customer-facing label: staff is shown as
                            "TECHNICIAN" (the person actually doing the work),
                            since "Staff" is ambiguous to a customer who only
                            knows they booked a provider. */}
                        {senderType === "staff" ? "Technician" : senderType}
                      </span>
                    ) : null}
                  </div>
                )}
                {m.type === "image" && m.attachments?.[0]?.url && (
                  <div className="relative group mb-1">
                    <a
                      href={resolveImageUrl(m.attachments[0].url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={resolveImageUrl(m.attachments[0].url)}
                        alt="attachment"
                        className="rounded-lg max-h-56 max-w-full"
                      />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        forceDownload(
                          resolveImageUrl(m.attachments[0].url),
                          m.attachments[0].originalFilename ||
                            `image-${Date.now()}.jpg`,
                        );
                      }}
                      title="Download image"
                      aria-label="Download image"
                      className="absolute top-1.5 right-1.5 bg-black/55 hover:bg-black/80 text-white rounded-full p-1.5 opacity-80 group-hover:opacity-100 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {m.type === "file" && m.attachments?.[0]?.url && (
                  <div
                    className={`flex items-center gap-2 mb-1 pl-3 pr-1.5 py-1.5 rounded-lg border ${
                      isSelf
                        ? "bg-blue-700/40 border-blue-400 text-white"
                        : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <Paperclip className="w-4 h-4 flex-shrink-0" />
                    <a
                      href={resolveImageUrl(m.attachments[0].url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 hover:underline"
                    >
                      <div className="text-xs font-medium truncate max-w-[180px]">
                        {m.attachments[0].originalFilename || "Attachment"}
                      </div>
                      {m.attachments[0].sizeBytes ? (
                        <div className={`text-[10px] ${isSelf ? "text-blue-100" : "text-slate-500"}`}>
                          {Math.round(m.attachments[0].sizeBytes / 1024)} KB
                        </div>
                      ) : null}
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        forceDownload(
                          resolveImageUrl(m.attachments[0].url),
                          m.attachments[0].originalFilename || "file",
                        );
                      }}
                      title="Download file"
                      aria-label="Download file"
                      className={`p-1.5 rounded-md flex-shrink-0 ${
                        isSelf
                          ? "hover:bg-white/20 text-white"
                          : "hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200"
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {m.content &&
                  m.content !== "[Image]" &&
                  !m.content.startsWith("[File:") && (
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

      {/* Typing indicator from another participant (provider/staff). */}
      {typingPayload &&
        typingPayload.expiresAt > Date.now() &&
        String(typingPayload.userId || "") !== currentUserId && (
          <div className="px-4 py-1.5 border-t border-slate-100 dark:border-slate-700/40">
            <span className="inline-block text-[11px] text-slate-500 dark:text-slate-400 italic">
              {typingPayload.name ||
                (typingPayload.userType === "provider"
                  ? "Provider"
                  : typingPayload.userType === "staff"
                    ? "Technician"
                    : "Someone")}{" "}
              is typing…
            </span>
          </div>
        )}

      <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900 flex gap-2 items-end">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={onPickImage}
          className="hidden"
        />
        <input
          ref={docRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
          onChange={onPickFile}
          className="hidden"
        />
        <div ref={attachWrapRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setAttachMenuOpen((v) => !v)}
            disabled={!canSend || busy}
            title="Attach"
            aria-label="Attach"
            aria-haspopup="menu"
            aria-expanded={attachMenuOpen}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          {attachMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-full left-0 mb-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-10"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAttachMenuOpen(false);
                  fileRef.current?.click();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
              >
                <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Image</span>
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAttachMenuOpen(false);
                  docRef.current?.click();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
              >
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>File</span>
              </button>
            </div>
          )}
        </div>
        <textarea
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            setDraft(v);
            if (canSend && v.length > 0) emitStartTyping();
            else stopTypingNow();
          }}
          onBlur={stopTypingNow}
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
