"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { MessageSquare, Users } from "lucide-react";
import { GroupAvatar } from "./GroupAvatar";

interface ConversationListProps {
    onSelect: (id: string) => void;
    selectedId?: string;
}

export function ConversationList({ onSelect, selectedId }: ConversationListProps) {
    const conversations = useQuery(api.conversations.list);

    if (!conversations) {
        return (
            <div className="p-4 space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-muted rounded w-3/4" />
                            <div className="h-2 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Search for users to start a chat</p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col">
                {conversations.map((conv) => (
                    <button
                        key={conv._id}
                        onClick={() => onSelect(conv._id)}
                        className={cn(
                            "flex items-center gap-4 px-4 py-5 text-left transition-all w-full relative group mx-2 my-1.5 rounded-[1.5rem] border border-transparent",
                            selectedId === conv._id
                                ? "glass-card bg-primary/25 border-primary/20 shadow-2xl shadow-primary/10 scale-[1.02]"
                                : "hover:bg-white/5 hover:border-white/5"
                        )}
                    >
                        <div className="relative shrink-0">
                            {conv.isGroup ? (
                                <GroupAvatar
                                    participantIds={conv.participants}
                                    size="md"
                                    className="group-hover:scale-105 transition-transform"
                                />
                            ) : (
                                <>
                                    <Avatar className="h-12 w-12 border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
                                        <AvatarImage src={conv.otherUser?.image} />
                                        <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary/40 to-primary/10 text-white">
                                            {conv.otherUser?.name?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {conv.otherUser?.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                                <span className="truncate text-[15px] font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                                    {conv.isGroup ? conv.name : conv.otherUser?.name}
                                </span>
                                {conv.lastMessage && (
                                    <span className={cn(
                                        "text-[10px] whitespace-nowrap shrink-0",
                                        conv.unreadCount > 0 ? "text-primary font-bold" : "text-muted-foreground"
                                    )}>
                                        {formatDistanceToNow(conv.lastMessage.createdAt, { addSuffix: false })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-3 mt-1">
                                <p className={cn(
                                    "truncate text-[13px] leading-tight flex-1",
                                    conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                                )}>
                                    {conv.lastMessage?.content ?? "No messages yet"}
                                </p>
                                {conv.unreadCount > 0 && (
                                    <Badge className="h-5 min-w-5 justify-center rounded-full px-1 text-[10px] shrink-0 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
                                        {conv.unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-6 left-20 h-[0.5px] bg-white/5" />
                    </button>
                ))}
            </div>
        </ScrollArea>
    );
}
