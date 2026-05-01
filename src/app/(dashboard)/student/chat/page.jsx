"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MessageSquare,
  Paperclip,
  Search,
} from "lucide-react";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "@/_lib/api/chat";

const STUDENT_ID = "s1"; // mock student id; replace with session.user.id once IDs land

export default function StudentChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);

  useEffect(() => {
    getConversations()
      .then((list) => {
        setConversations(list);
        // Auto-pick the first conversation on desktop only — guarded behind
        // window check so it doesn't run during SSR.
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
          setActiveId(list[0]?.id ?? null);
        }
      })
      .finally(() => setLoadingConvos(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.participant_name.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
      {/* Conversation list */}
      <aside
        className={`flex w-full shrink-0 flex-col border-r border-[var(--border-color)] md:w-72 ${
          activeId ? "hidden md:flex" : "flex"
        }`}
      >
        <header className="flex flex-col gap-3 border-b border-[var(--border-color)] p-4">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <ConvoListSkeleton />
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-[var(--text-secondary)]">No matches.</p>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((c, i) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  active={c.id === activeId}
                  index={i}
                  onClick={() => setActiveId(c.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat thread */}
      <section
        className={`flex flex-1 flex-col ${
          activeId ? "flex" : "hidden md:flex"
        }`}
      >
        {active ? (
          <ChatThread
            conversation={active}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <EmptyChatState />
        )}
      </section>
    </div>
  );
}

function ConversationItem({ conversation, active, index, onClick }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <button
        type="button"
        onClick={onClick}
        className={`relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-secondary)] ${
          active ? "bg-[#10B981]/10" : ""
        }`}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#10B981]"
          />
        )}
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#10B981] text-sm font-bold text-white">
          {conversation.participant_initial}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`truncate text-sm ${
                active ? "font-bold text-[#10B981]" : "font-semibold text-[var(--text-primary)]"
              }`}
            >
              {conversation.participant_name}
            </span>
            <span className="shrink-0 text-[10px] text-[var(--text-muted)] font-mono-ui">
              {formatLastMsgTime(conversation.last_message_time)}
            </span>
          </div>
          <span className="mt-0.5 line-clamp-1 text-xs text-[var(--text-secondary)]">
            {conversation.last_message}
          </span>
        </div>
        {conversation.unread_count > 0 && !active && (
          <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-[#10B981] px-1.5 text-[10px] font-bold text-white font-mono-ui">
            {conversation.unread_count}
          </span>
        )}
      </button>
    </motion.li>
  );
}

function formatLastMsgTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return isSameDay(d, new Date()) ? format(d, "HH:mm") : format(d, "MMM d");
}

function ConvoListSkeleton() {
  return (
    <ul className="flex flex-col gap-2 p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="skeleton-shimmer h-14 rounded-xl" />
      ))}
    </ul>
  );
}

function EmptyChatState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]">
        <MessageSquare className="h-7 w-7" />
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        Select a conversation to start chatting
      </p>
    </div>
  );
}

// ── Chat thread ───────────────────────────────────────────────────────────

function ChatThread({ conversation, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    getMessages(conversation.id)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [conversation.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const optimistic = {
      id: `tmp-${Date.now()}`,
      sender_id: STUDENT_ID,
      receiver_id: conversation.participant_id,
      message: text,
      file_url: null,
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setSending(true);

    try {
      const saved = await sendMessage({
        sender_id: STUDENT_ID,
        receiver_id: conversation.participant_id,
        message: text,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? saved : m))
      );
    } catch {
      toast.error("Couldn't send message");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024) {
      toast.error("File must be under 1MB");
      e.target.value = "";
      return;
    }
    toast.info(`Selected ${f.name} — file upload is stubbed in this batch`);
    e.target.value = "";
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-[var(--border-color)] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="grid h-8 w-8 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#10B981] text-sm font-bold text-white">
          {conversation.participant_initial}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-[var(--text-primary)]">
            {conversation.participant_name}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
            {conversation.participant_role}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[var(--bg-secondary)] px-4 py-5">
        {loading ? (
          <div className="grid h-full place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#10B981]" />
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={endRef} />
      </div>

      <footer className="flex items-center gap-2 border-t border-[var(--border-color)] p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
        />
        <motion.button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          whileTap={{ scale: 0.94 }}
          aria-label="Send message"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#10B981] text-white transition-colors hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </motion.button>
      </footer>
    </>
  );
}

function MessageList({ messages }) {
  // Group messages with date separators between different days.
  const blocks = [];
  let lastDate = null;
  for (const m of messages) {
    const d = new Date(m.created_at);
    if (!lastDate || !isSameDay(d, lastDate)) {
      blocks.push({ kind: "date", key: `d-${m.id}`, value: d });
      lastDate = d;
    }
    blocks.push({ kind: "msg", key: m.id, value: m });
  }

  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {blocks.map((b) =>
          b.kind === "date" ? (
            <li key={b.key} className="my-3 flex items-center justify-center">
              <span className="rounded-full bg-[var(--bg-card)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
                {format(b.value, "MMM d, yyyy")}
              </span>
            </li>
          ) : (
            <MessageBubble key={b.key} message={b.value} />
          )
        )}
      </AnimatePresence>
    </ul>
  );
}

function MessageBubble({ message }) {
  const sent = message.sender_id === STUDENT_ID;
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col ${sent ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
          sent
            ? "bg-[#10B981] text-white rounded-br-md"
            : "bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-md"
        } ${message._pending ? "opacity-70" : ""}`}
      >
        {message.message}
      </div>
      <span className="mt-1 px-1 text-[10px] text-[var(--text-muted)] font-mono-ui">
        {format(new Date(message.created_at), "HH:mm")}
      </span>
    </motion.li>
  );
}
