"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, ArrowDown, Circle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
    conversationId: any;
    onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const [content, setContent] = useState("");
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const messages = useQuery(api.messages.list, { conversationId });
    const sendMessage = useMutation(api.messages.send);
    const markRead = useMutation(api.messages.markRead);
    const typing = useQuery(api.typing.get, { conversationId });
    const setTyping = useMutation(api.typing.set);
    const conversations = useQuery(api.conversations.list);
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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        await sendMessage({ conversationId, content: content.trim() });
        setContent("");
        setTyping({ conversationId, isTyping: false });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 50);
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
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full border-2 border-t-primary border-border animate-spin" />
                    <p className="text-xs">Loading conversation...</p>
                </div>
            </div>
        );
    }

    const isOnline = conversation.otherUser?.isOnline;
    const firstName = conversation.otherUser?.name?.split(" ")[0] ?? "them";

    return (
        <div className="flex h-full flex-col w-full">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0 bg-card">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden h-8 w-8 shrink-0 rounded-lg">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <div className="relative shrink-0">
                    <Avatar className="h-10 w-10 border-2 border-border">
                        <AvatarImage src={conversation.otherUser?.image} />
                        <AvatarFallback className="font-bold text-sm bg-primary/20 text-primary">
                            {conversation.otherUser?.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                        isOnline ? "bg-emerald-500" : "bg-zinc-600"
                    )} />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold truncate leading-tight">{conversation.otherUser?.name}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Circle className={cn("h-2 w-2 fill-current", isOnline ? "text-emerald-500" : "text-zinc-500")} />
                        <span className={cn("text-xs font-medium", isOnline ? "text-emerald-400" : "text-muted-foreground")}>
                            {isOnline ? "Active now" : "Offline"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="relative flex-1 overflow-hidden" style={{ background: "oklch(0.12 0 0)" }}>
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

                    {messages?.map((msg, idx) => {
                        const isMe = msg.senderId !== conversation.otherUser?._id;
                        const prevMsg = messages[idx - 1];
                        const showTimestamp = !prevMsg || msg.createdAt - prevMsg.createdAt > 300000;
                        const isLast = idx === messages.length - 1;

                        return (
                            <div key={msg._id}>
                                {showTimestamp && (
                                    <div className="flex justify-center my-3">
                                        <span className="text-[11px] text-muted-foreground/70 bg-white/5 px-3 py-0.5 rounded-full border border-white/5">
                                            {formatDate(msg.createdAt)}
                                        </span>
                                    </div>
                                )}
                                <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[70%] px-3.5 py-2 text-sm leading-relaxed rounded-2xl",
                                        isMe
                                            ? "bg-primary text-primary-foreground rounded-br-sm"
                                            : "bg-[oklch(0.20_0_0)] text-foreground border border-white/8 rounded-bl-sm"
                                    )}>
                                        {msg.content}
                                        {isLast && (
                                            <div className={cn("text-[10px] mt-0.5 text-right", isMe ? "text-primary-foreground/50" : "text-muted-foreground/50")}>
                                                {format(new Date(msg.createdAt), "h:mm a")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing indicator */}
                    {typing && typing.length > 0 && (
                        <div className="flex justify-start mt-1">
                            <div className="flex items-center gap-1.5 bg-[oklch(0.20_0_0)] border border-white/8 rounded-2xl rounded-bl-sm px-4 py-2.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
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
            <form
                onSubmit={handleSend}
                className="border-t border-border px-3 py-3 flex gap-2 items-center shrink-0 bg-card"
            >
                <Input
                    placeholder={`Message ${firstName}...`}
                    value={content}
                    onChange={handleInputChange}
                    className="flex-1 bg-background border-white/8 text-sm h-10 rounded-xl focus-visible:ring-primary/40"
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e as any);
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!content.trim()}
                    className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 shrink-0"
                >
                    <Send className="h-4 w-4" />
                </button>
            </form>
        </div>
    );
}
