"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function UserSearch({ onSelect }: { onSelect: (id: string) => void }) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const users = useQuery(api.users.listAll, open ? { search } : "skip");
    const startConversation = useMutation(api.conversations.getOrCreate);

    const handleSelect = async (userId: any) => {
        const conversationId = await startConversation({ otherUserId: userId });
        onSelect(conversationId);
        setOpen(false);
        setSearch("");
    };

    return (
        <div className="px-4 py-3 shrink-0">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-3 text-muted-foreground h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-xl transition-all duration-300 group backdrop-blur-md">
                        <Search className="h-4 w-4 shrink-0 transition-transform group-hover:scale-125 group-hover:text-primary" />
                        <span className="truncate font-medium">Search messages or people...</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden gap-0">
                    <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Users className="h-4 w-4 text-primary" />
                            Find People
                        </DialogTitle>
                    </DialogHeader>

                    <div className="px-4 py-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search by name..."
                                className="pl-9 h-9 rounded-xl bg-muted/50 border-transparent focus:border-border text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <ScrollArea className="h-[320px]">
                        <div className="p-2 space-y-1">
                            {!users || users === undefined ? (
                                <div className="space-y-1 p-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
                                            <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-muted rounded w-2/3" />
                                                <div className="h-2 bg-muted rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : users.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No users found</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        {search ? `No one matches "${search}"` : "Other users will appear here once they sign in"}
                                    </p>
                                </div>
                            ) : (
                                users.map((user) => (
                                    <button
                                        key={user._id}
                                        onClick={() => handleSelect(user._id)}
                                        className="flex w-full items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent text-left group"
                                    >
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarImage src={user.image} />
                                            <AvatarFallback className="text-xs font-semibold">{user.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <UserPlus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
