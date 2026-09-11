import { useEffect, useRef, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import {
    AlertCircle,
    Check,
    Copy,
    FileText,
    RotateCcw,
    Send,
    Sparkles,
    UserRoundSearch,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { cn } from "@/lib/utils.ts";
import { BACKEND_BASE_URL } from "@/constants";
import type { User } from "@/types";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: number;
    isError?: boolean;
};

type Suggestion = { icon: typeof UserRoundSearch; text: string };

const SUGGESTIONS: Suggestion[] = [
    { icon: UserRoundSearch, text: "How is Jane Doe doing in her classes?" },
    { icon: FileText, text: "Has John Smith submitted his latest assignments?" },
    { icon: AlertCircle, text: "Which of my students have attendance below 75%?" },
    { icon: Sparkles, text: "Give me a quick summary for student stu_123." },
];

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getInitials = (name = "") =>
    name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    h1: ({ children }) => <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
    h2: ({ children }) => <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
    h3: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h4>,
    code: ({ children }) => (
        <code className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10">{children}</code>
    ),
    table: ({ children }) => (
        <div className="mb-2 overflow-x-auto rounded-md border">
            <table className="w-full text-xs">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
    th: ({ children }) => <th className="border-b px-2 py-1 text-left font-medium">{children}</th>,
    td: ({ children }) => <td className="border-b px-2 py-1 align-top">{children}</td>,
    a: ({ children, href }) => (
        <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {children}
        </a>
    ),
    hr: () => <hr className="my-2 border-border" />,
};

const TypingIndicator = () => (
    <div className="flex items-center gap-1 px-1 py-1.5">
        {[0, 1, 2].map((i) => (
            <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            />
        ))}
    </div>
);

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    aria-label="Copy response"
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(text);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                        } catch {
                            toast.error("Couldn't copy to clipboard.");
                        }
                    }}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            </TooltipTrigger>
            <TooltipContent side="top">{copied ? "Copied" : "Copy"}</TooltipContent>
        </Tooltip>
    );
};

const AiAssistantPage = () => {
    const { data: identity } = useGetIdentity<User>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, sending]);

    useEffect(() => {
        textareaRef.current?.focus();
    }, [sending]);

    const sendMessage = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;

        const history = messages
            .filter((m) => !m.isError)
            .map((m) => ({ role: m.role, content: m.content }));

        setMessages((prev) => [...prev, { id: genId(), role: "user", content: trimmed, createdAt: Date.now() }]);
        setInput("");
        setSending(true);

        try {
            const res = await fetch(`${BACKEND_BASE_URL}/ai-assistant/chat`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed, history }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? "The assistant failed to respond.");
            setMessages((prev) => [
                ...prev,
                { id: genId(), role: "assistant", content: json.message as string, createdAt: Date.now() },
            ]);
        } catch (e) {
            const errText = e instanceof Error ? e.message : "The assistant failed to respond.";
            toast.error(errText);
            setMessages((prev) => [
                ...prev,
                { id: genId(), role: "assistant", content: errText, createdAt: Date.now(), isError: true },
            ]);
        } finally {
            setSending(false);
        }
    };

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    return (
        <div className="ai-assistant-page space-y-4">
            <Breadcrumb />

            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-wrap items-center justify-between gap-3"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">AI Student Assistant</h1>
                        <p className="text-sm text-muted-foreground">
                            Ask about any student by name or ID — grades, attendance, assignments, and documents.
                        </p>
                    </div>
                </div>

                {messages.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMessages([])}
                        disabled={sending}
                    >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> New chat
                    </Button>
                )}
            </motion.div>

            <Card className="flex h-[calc(100vh-260px)] min-h-[520px] flex-col overflow-hidden py-0 shadow-sm">
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        Staff only &middot; conversation isn't saved after you leave this page
                    </div>
                    <span className="text-xs text-muted-foreground">Powered by Claude</span>
                </div>

                <ScrollArea className="flex-1 px-4 py-4">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="flex h-full flex-col items-center justify-center gap-5 py-10 text-center"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10">
                                <Sparkles className="h-7 w-7 text-indigo-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Ask me about any student</p>
                                <p className="max-w-sm text-xs text-muted-foreground">
                                    I'll look them up and pull together grades, attendance, submissions, and documents.
                                </p>
                            </div>
                            <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                                {SUGGESTIONS.map((s, i) => (
                                    <motion.button
                                        key={s.text}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
                                        whileHover={{ y: -2 }}
                                        onClick={() => sendMessage(s.text)}
                                        className="flex items-start gap-2 rounded-lg border p-3 text-left text-xs text-muted-foreground transition-colors hover:border-indigo-200 hover:bg-muted hover:text-foreground"
                                    >
                                        <s.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                        {s.text}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div>
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => {
                                    const isUser = msg.role === "user";
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                            className={cn("group mb-4 flex gap-2.5", isUser ? "justify-end" : "justify-start")}
                                        >
                                            {!isUser && (
                                                <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                                                    <AvatarFallback
                                                        className={cn(
                                                            "text-white",
                                                            msg.isError
                                                                ? "bg-red-500"
                                                                : "bg-gradient-to-br from-violet-500 to-indigo-500"
                                                        )}
                                                    >
                                                        {msg.isError ? <AlertCircle className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div className={cn("flex max-w-[75%] flex-col", isUser ? "items-end" : "items-start")}>
                                                <div
                                                    className={cn(
                                                        "rounded-2xl px-3.5 py-2 text-sm",
                                                        isUser
                                                            ? "rounded-br-sm bg-primary text-primary-foreground"
                                                            : msg.isError
                                                                ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                                                                : "rounded-bl-sm bg-muted"
                                                    )}
                                                >
                                                    {isUser ? (
                                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    ) : (
                                                        <div className="text-sm [&_>*:last-child]:mb-0">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-1 flex items-center gap-2 px-1">
                                                    <span className="text-[10px] text-muted-foreground">{format(msg.createdAt, "h:mm a")}</span>
                                                    {!isUser && !msg.isError && <CopyButton text={msg.content} />}
                                                    {msg.isError && (
                                                        <button
                                                            onClick={() => sendMessage(lastUserMessage)}
                                                            className="text-[10px] font-medium text-primary hover:underline"
                                                        >
                                                            Try again
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {isUser && (
                                                <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                                                    {identity?.image && <AvatarImage src={identity.image} />}
                                                    <AvatarFallback className="text-[10px]">{getInitials(identity?.name)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {sending && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mb-4 flex justify-start gap-2.5"
                                >
                                    <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                                            <Sparkles className="h-3.5 w-3.5" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-2xl rounded-bl-sm bg-muted px-1">
                                        <TypingIndicator />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                    <div ref={bottomRef} />
                </ScrollArea>

                <div className="border-t p-3">
                    <div className="flex items-end gap-2">
                        <Textarea
                            ref={textareaRef}
                            placeholder="Ask about a student... (Shift+Enter for a new line)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(input);
                                }
                            }}
                            disabled={sending}
                            rows={1}
                            className="max-h-40 min-h-10 resize-none py-2"
                        />
                        <Button
                            onClick={() => sendMessage(input)}
                            disabled={sending || !input.trim()}
                            size="icon"
                            aria-label="Send message"
                            className="h-10 w-10 shrink-0"
                        >
                            <Send className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                    <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
                        AI can make mistakes. Double-check anything important before acting on it.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default AiAssistantPage;
