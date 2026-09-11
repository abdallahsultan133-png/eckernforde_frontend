import { useEffect, useMemo, useRef, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { cn } from "@/lib/utils.ts";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import type { User } from "@/types";

type Partner = { id: string; name: string; email: string; image: string | null; role: string };
type Conversation = { partner: Partner; lastMessage: string; lastAt: string; unreadCount: number };
type Message = { id: number; content: string; senderId: string; read: boolean; createdAt: string; sender: { id: string; name: string; image: string | null } };

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const timeAgo = (iso: string) => {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const MessagesPage = () => {
    const { data: identity } = useGetIdentity<User>();
    const queryClient = useQueryClient();
    const [activePartner, setActivePartner] = useState<Partner | null>(null);
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [startingNew, setStartingNew] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const conversationsPath = "/messages/conversations";
    const { data: conversationsData, isLoading: convsLoading } = useApiQuery<{ data: Conversation[] }>(conversationsPath, {
        refetchInterval: 15000,
    });
    const conversations = conversationsData?.data ?? [];

    const threadPath = activePartner ? `/messages/thread/${activePartner.id}` : null;
    const { data: threadData, isLoading: threadLoading } = useApiQuery<{ data: Message[] }>(threadPath, {
        refetchInterval: activePartner ? 4000 : false,
    });
    const thread = useMemo(() => threadData?.data ?? [], [threadData]);

    const loadThread = (partner: Partner) => setActivePartner(partner);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread]);

    const handleSend = async () => {
        if (!content.trim() || !activePartner) return;
        setSending(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/messages`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId: activePartner.id, content: content.trim() }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            const { data: msg } = await res.json();
            queryClient.setQueryData<{ data: Message[] }>([threadPath], (prev) =>
                prev ? { data: [...prev.data, msg] } : { data: [msg] }
            );
            setContent("");
            queryClient.invalidateQueries({ queryKey: [conversationsPath] });
        } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to send"); }
        finally { setSending(false); }
    };

    const handleNewConversation = async () => {
        if (!newEmail.trim()) return;
        setStartingNew(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/users/lookup?email=${encodeURIComponent(newEmail.trim())}`, { credentials: "include" });
            if (!res.ok) return toast.error("No user found with that email.");
            const json = await res.json();
            const found = json.data;
            if (!found) return toast.error("No user found with that email.");
            setNewEmail("");
            loadThread({ id: found.id, name: found.name, email: found.email, image: found.image ?? null, role: found.role });
        } catch { toast.error("User not found."); }
        finally { setStartingNew(false); }
    };

    return (
        <div className="messages-page space-y-4">
            <PageHeader breadcrumb title="Messages" description="Direct messages with your school community." />

            <div className="grid gap-4 md:grid-cols-3 h-[calc(100vh-220px)] min-h-[500px]">
                {/* Conversations sidebar — hidden on mobile once a thread is open */}
                <Card className={cn("flex-col overflow-hidden", activePartner ? "hidden md:flex" : "flex")}>
                    <div className="p-3 border-b">
                        <div className="flex gap-2">
                            <Input aria-label="Start a new conversation by email" placeholder="Start new: enter email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleNewConversation(); }} className="text-xs" />
                            <Button size="sm" aria-label="Start conversation" onClick={handleNewConversation} disabled={startingNew}>+</Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        {convsLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3">
                                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-40" /></div>
                                </div>
                            ))
                        ) : conversations.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                                <MessageSquare className="mx-auto mb-2 h-5 w-5" />No conversations yet.
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div key={conv.partner.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-current={activePartner?.id === conv.partner.id}
                                    aria-label={`Open conversation with ${conv.partner.name}`}
                                    onClick={() => loadThread(conv.partner)}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadThread(conv.partner); } }}
                                    className={cn("flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        activePartner?.id === conv.partner.id && "bg-muted"
                                    )}>
                                    <Avatar className="h-9 w-9 shrink-0">
                                        {conv.partner.image && <AvatarImage src={conv.partner.image} />}
                                        <AvatarFallback>{getInitials(conv.partner.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className="text-sm font-medium truncate">{conv.partner.name}</p>
                                            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(conv.lastAt)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <Badge className="shrink-0 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">{conv.unreadCount}</Badge>
                                    )}
                                </div>
                            ))
                        )}
                    </ScrollArea>
                </Card>

                {/* Chat thread — full-width on mobile, hidden until a thread is open */}
                <Card className={cn("md:col-span-2 flex-col overflow-hidden", activePartner ? "flex" : "hidden md:flex")}>
                    {!activePartner ? (
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                            <div className="text-center">
                                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                Select a conversation or start a new one.
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 border-b p-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="-ml-1 h-8 w-8 shrink-0 md:hidden"
                                    onClick={() => setActivePartner(null)}
                                    aria-label="Back to conversations"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <Avatar className="h-8 w-8">
                                    {activePartner.image && <AvatarImage src={activePartner.image} />}
                                    <AvatarFallback>{getInitials(activePartner.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{activePartner.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{activePartner.role}</p>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-4">
                                {threadLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className={cn("flex mb-3", i % 2 === 0 ? "justify-start" : "justify-end")}>
                                            <Skeleton className="h-9 w-48 rounded-2xl" />
                                        </div>
                                    ))
                                ) : thread.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</p>
                                ) : (
                                    thread.map((msg) => {
                                        const isOwn = msg.senderId === identity?.id;
                                        return (
                                            <div key={msg.id} className={cn("flex mb-3 gap-2", isOwn ? "justify-end" : "justify-start")}>
                                                {!isOwn && (
                                                    <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                                                        {msg.sender.image && <AvatarImage src={msg.sender.image} />}
                                                        <AvatarFallback className="text-[10px]">{getInitials(msg.sender.name)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn("max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                                                    isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                                                )}>
                                                    <p>{msg.content}</p>
                                                    <p className={cn("text-[10px] mt-0.5", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>{timeAgo(msg.createdAt)}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={bottomRef} />
                            </ScrollArea>

                            <Separator />
                            <div className="flex gap-2 p-3">
                                <Input
                                    placeholder="Type a message..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                />
                                <Button onClick={handleSend} disabled={sending || !content.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default MessagesPage;
