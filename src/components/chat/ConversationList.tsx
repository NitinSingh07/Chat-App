"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

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
            <div className="flex flex-col gap-0.5 p-2">
                {conversations.map((conv) => (
                    <button
                        key={conv._id}
                        onClick={() => onSelect(conv._id)}
                        className={cn(
                            "flex items-center gap-3 rounded-xl p-3 text-left transition-all w-full hover:bg-accent/60",
                            selectedId === conv._id && "bg-accent"
                        )}
                    >
                        <div className="relative shrink-0">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={conv.otherUser?.image} />
                                <AvatarFallback className="text-xs font-semibold">{conv.otherUser?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            {conv.otherUser?.isOnline && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-medium">{conv.otherUser?.name}</span>
                                {conv.lastMessage && (
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                        {formatDistanceToNow(conv.lastMessage.createdAt, { addSuffix: false })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p className="truncate text-xs text-muted-foreground">
                                    {conv.lastMessage?.content ?? "No messages yet"}
                                </p>
                                {conv.unreadCount > 0 && (
                                    <Badge className="h-4 min-w-4 justify-center rounded-full px-1 text-[9px] shrink-0 bg-primary text-primary-foreground">
                                        {conv.unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
    );
}
