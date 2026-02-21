"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, ArrowDown, Circle, Trash2, Smile, AlertCircle, RefreshCw, Users, MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupAvatar } from "./GroupAvatar";
import { GroupSettingsDialog } from "./GroupSettingsDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
    conversationId: any;
    onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const [content, setContent] = useState("");
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [failedMessages, setFailedMessages] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const messages = useQuery(api.messages.list, { conversationId });
    const sendMessage = useMutation(api.messages.send);
    const removeMessage = useMutation(api.messages.remove);
    const toggleReaction = useMutation(api.messages.toggleReaction);
    const markRead = useMutation(api.messages.markRead);
    const typing = useQuery(api.typing.get, { conversationId });
    const setTyping = useMutation(api.typing.set);
    const conversations = useQuery(api.conversations.list);
    const me = useQuery(api.users.getMe);
    const conversation = conversations?.find((c) => c._id === conversationId);

    useEffect(() => {
        if (conversationId) markRead({ conversationId });
    }, [conversationId, messages, markRead]);

    useEffect(() => {
        if (scrollRef.current && !showScrollButton) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, showScrollButton]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 120);
    };

    const handleSend = async (e?: React.FormEvent, retryContent?: string) => {
        if (e) e.preventDefault();
        const msgContent = retryContent || content.trim();
        if (!msgContent) return;

        if (!retryContent) {
            setContent("");
            setTyping({ conversationId, isTyping: false });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }

        try {
            await sendMessage({ conversationId, content: msgContent });
            if (retryContent) {
                setFailedMessages(prev => prev.filter(m => m.content !== retryContent));
            }
            setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }, 50);
        } catch (error) {
            console.error("Failed to send message:", error);
            if (!retryContent) {
                setFailedMessages(prev => [...prev, {
                    content: msgContent,
                    timestamp: Date.now(),
                    _id: `failed-${Date.now()}`
                }]);
            }
            toast.error("Message failed to send. Please try again.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);
        setTyping({ conversationId, isTyping: e.target.value.length > 0 });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (e.target.value.length > 0) {
            typingTimeoutRef.current = setTimeout(() => {
                setTyping({ conversationId, isTyping: false });
            }, 2000);
        }
    };

    const formatDate = (date: number) => {
        const now = new Date();
        const msgDate = new Date(date);
        if (msgDate.getFullYear() !== now.getFullYear()) return format(msgDate, "MMM d, yyyy h:mm a");
        if (format(msgDate, "yyyy-MM-dd") !== format(now, "yyyy-MM-dd")) return format(msgDate, "MMM d, h:mm a");
        return format(msgDate, "h:mm a");
    };

    if (!conversation) {
        return (
            <div className="flex h-full flex-col w-full">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0 bg-card">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-hidden">
                    <div className="flex justify-start"><Skeleton className="h-10 w-2/3 rounded-2xl" /></div>
                    <div className="flex justify-end"><Skeleton className="h-10 w-1/2 rounded-2xl" /></div>
                    <div className="flex justify-start"><Skeleton className="h-10 w-3/4 rounded-2xl" /></div>
                    <div className="flex justify-end"><Skeleton className="h-10 w-2/3 rounded-2xl" /></div>
                    <div className="flex justify-start"><Skeleton className="h-10 w-1/2 rounded-2xl" /></div>
                </div>
                <div className="p-3 border-t border-border bg-card">
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    const isOnline = conversation.otherUser?.isOnline;
    const firstName = conversation.isGroup ? "the group" : (conversation.otherUser?.name?.split(" ")[0] ?? "them");

    return (
        <div className="flex h-full flex-col w-full">
            {/* Header */}
            <div className="flex items-center gap-0 border-b border-white/5 px-2 py-3 shrink-0 glass-card bg-background/30 backdrop-blur-2xl sticky top-0 z-30 shadow-lg">
                {onBack && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-10 w-10 text-muted-foreground mr-1 hover:bg-white/5 rounded-xl"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}

                <div className="flex items-center gap-3.5 flex-1 min-w-0 py-1.5 px-2.5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="relative shrink-0">
                        {conversation.isGroup ? (
                            <GroupAvatar participantIds={conversation.participants} size="md" />
                        ) : (
                            <>
                                <Avatar className="h-11 w-11 border-2 border-white/10 shadow-xl group-hover:scale-105 transition-transform duration-300">
                                    <AvatarImage src={conversation.otherUser?.image} />
                                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary to-primary/40 text-white">
                                        {conversation.otherUser?.name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className={cn(
                                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#1a1c2e] shadow-lg transition-colors duration-500",
                                    isOnline ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-zinc-600"
                                )} />
                            </>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0 gap-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <h2 className="text-[16px] font-bold truncate leading-tight tracking-tight text-white group-hover:text-primary transition-colors">
                                {conversation.isGroup ? conversation.name : conversation.otherUser?.name}
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={cn(
                                "text-[11px] font-bold leading-none tracking-wide flex items-center gap-1.5",
                                conversation.isGroup ? "text-primary" : (isOnline ? "text-emerald-400" : "text-muted-foreground")
                            )}>
                                {!conversation.isGroup && isOnline && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                {conversation.isGroup ? `${conversation.memberCount} MEMBERS` : (isOnline ? "ACTIVE NOW" : "OFFLINE")}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pr-3">
                    {conversation.isGroup && (
                        <GroupSettingsDialog
                            conversationId={conversationId}
                            currentName={conversation.name || ""}
                            currentParticipants={conversation.participants}
                            isAdmin={conversation.adminId === me?._id}
                        />
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="relative flex-1 overflow-hidden">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto px-4 py-4 flex flex-col gap-1.5"
                >
                    {messages?.length === 0 && (
                        <div className="flex-1 flex items-center justify-center h-full">
                            <div className="text-center space-y-3 py-16">
                                <div className="text-4xl">👋</div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Say hello to {firstName}!</p>
                                    <p className="text-xs text-muted-foreground mt-1">Be the first to send a message.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {messages && messages.length > 0 && <div className="mt-auto" />}

                    {messages?.map((msg, idx) => {
                        const isMe = msg.senderId === me?._id;
                        const prevMsg = messages[idx - 1];
                        const showTimestamp = !prevMsg || msg.createdAt - prevMsg.createdAt > 300000;
                        const isNewGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

                        return (
                            <div key={msg._id} className={cn("flex flex-col", isNewGroup && !showTimestamp ? "mt-4" : "")}>
                                {showTimestamp && (
                                    <div className="flex justify-center my-6">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
                                            {formatDate(msg.createdAt)}
                                        </span>
                                    </div>
                                )}
                                <div className={cn("flex group items-start gap-1.5 shadow-sm transition-all", isMe ? "justify-end" : "justify-start")}>
                                    {isMe && !msg.isDeleted && (
                                        <button
                                            onClick={() => removeMessage({ messageId: msg._id })}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive mt-1"
                                            title="Delete message"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}

                                    {/* Reaction Picker Trigger */}
                                    {!msg.isDeleted && (
                                        <div className={cn("mt-1", isMe ? "order-first mr-1" : "order-last ml-1")}>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-primary">
                                                        <Smile className="h-4 w-4" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-fit p-1.5 flex gap-1 bg-card border-border" side="top">
                                                    {["👍", "❤️", "😂", "😮", "😢"].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => toggleReaction({ messageId: msg._id, emoji })}
                                                            className="hover:bg-white/10 p-1.5 rounded-lg transition-colors text-lg"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}

                                    <div className={cn("flex flex-col gap-1 items-end max-w-[85%] sm:max-w-[70%]")}>
                                        {conversation.isGroup && !isMe && isNewGroup && !msg.isDeleted && (
                                            <span className="text-[10px] font-bold text-primary ml-4 mb-0.5 uppercase tracking-wider">
                                                {msg.senderName || "Unknown User"}
                                            </span>
                                        )}
                                        <div className={cn(
                                            "px-4 py-3 text-[14.5px] leading-relaxed shadow-xl transition-all relative overflow-hidden",
                                            isMe
                                                ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[1.25rem] rounded-tr-[4px]"
                                                : "glass-card bg-[#202c33]/40 text-foreground border-white/5 rounded-[1.25rem] rounded-tl-[4px]",
                                            msg.isDeleted && "opacity-60 italic"
                                        )}>
                                            {isMe && <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />}
                                            <span className="relative z-10">{msg.content}</span>
                                        </div>

                                        {/* Reactions Display */}
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className={cn("flex flex-wrap gap-1 mt-0.5", isMe ? "justify-end" : "justify-start")}>
                                                {Object.entries(
                                                    msg.reactions.reduce((acc: any, r) => {
                                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                        return acc;
                                                    }, {})
                                                ).map(([emoji, count]: [string, any]) => {
                                                    const hasMyReaction = msg.reactions?.some(r => r.userId === me?._id && r.emoji === emoji);
                                                    return (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => toggleReaction({ messageId: msg._id, emoji })}
                                                            className={cn(
                                                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                                                                hasMyReaction
                                                                    ? "bg-primary/20 border-primary/40 text-primary-foreground"
                                                                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                                                            )}
                                                        >
                                                            <span>{emoji}</span>
                                                            <span className="font-medium">{count}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Failed Messages */}
                    {failedMessages.map(msg => (
                        <div key={msg._id} className="flex justify-end group mt-1">
                            <div className="flex flex-col gap-1 items-end max-w-[85%] sm:max-w-[70%]">
                                <div className="bg-destructive/10 text-destructive border border-destructive/20 px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl rounded-br-sm relative shadow-sm">
                                    {msg.content}
                                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleSend(undefined, msg.content)}
                                            className="p-1.5 bg-background border border-border rounded-xl hover:bg-accent text-foreground transition-colors shadow-lg"
                                            title="Retry"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setFailedMessages(prev => prev.filter(m => m._id !== msg._id))}
                                            className="p-1.5 bg-background border border-border rounded-xl hover:bg-accent text-destructive transition-colors shadow-lg"
                                            title="Discard"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-destructive font-medium pr-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Failed to send
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {typing && typing.length > 0 && (
                        <div className="flex justify-start mt-1">
                            <div className="flex items-center gap-3 bg-[oklch(0.20_0_0)] border border-white/8 rounded-2xl rounded-bl-sm px-4 py-2">
                                <div className="flex gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                    {typing.length === 1
                                        ? `${typing[0]} is typing...`
                                        : typing.length === 2
                                            ? `${typing[0]} and ${typing[1]} are typing...`
                                            : `${typing[0]} and ${typing.length - 1} others are typing...`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scroll button */}
                {showScrollButton && (
                    <button
                        className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full shadow-xl h-9 w-9 flex items-center justify-center hover:opacity-90 transition-opacity border border-primary/50"
                        onClick={() => {
                            setShowScrollButton(false);
                            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                        }}
                    >
                        <ArrowDown className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Input bar */}
            <div className="p-4 bg-background/20 backdrop-blur-2xl border-t border-white/5 shrink-0 z-30">
                <form
                    onSubmit={handleSend}
                    className="flex gap-3 items-center max-w-5xl mx-auto"
                >
                    <div className="flex-1 relative flex items-center group">
                        <Input
                            placeholder={`Type a message...`}
                            value={content}
                            onChange={handleInputChange}
                            className="w-full bg-white/5 border-white/5 text-[15px] h-12 pl-6 pr-14 rounded-full focus-visible:ring-2 focus-visible:ring-primary/40 transition-all shadow-2xl group-hover:bg-white/10"
                            autoComplete="off"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e as any);
                                }
                            }}
                        />
                        <div className="absolute right-3 px-1">
                            <button
                                type="button"
                                className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-white transition-all hover:bg-white/10 active:scale-95"
                            >
                                <Smile className="h-5.5 w-5.5" />
                            </button>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!content.trim()}
                        className={cn(
                            "h-12 w-12 rounded-full transition-all shrink-0 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] active:scale-90",
                            content.trim()
                                ? "bg-gradient-to-tr from-indigo-600 to-violet-600 dark:from-primary dark:to-primary/60 scale-100 opacity-100"
                                : "bg-white/5 scale-90 opacity-40"
                        )}
                    >
                        <Send className="h-5.5 w-5.5 text-white" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
