"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CreateGroupDialog({ children, onSelect }: { children: React.ReactNode, onSelect: (id: string) => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    const users = useQuery(api.users.listAll, open ? { search } : "skip");
    const createGroup = useMutation(api.conversations.createGroup);

    const toggleUser = (userId: any) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please enter a group name");
            return;
        }
        if (selectedUsers.length < 1) {
            toast.error("Please select at least one member");
            return;
        }

        try {
            const conversationId = await createGroup({
                name,
                participantIds: selectedUsers
            });
            onSelect(conversationId);
            setOpen(false);
            reset();
            toast.success("Group created successfully!");
        } catch (error) {
            toast.error("Failed to create group");
        }
    };

    const reset = () => {
        setName("");
        setSelectedUsers([]);
        setSearch("");
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) reset();
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden glass-card">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                        <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        Create New Group
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Group Name</label>
                        <Input
                            placeholder="Engineering Team, Family, etc."
                            className="h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 text-[15px]"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Members</label>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                                {selectedUsers.length} SELECTED
                            </span>
                        </div>

                        <div className="relative">
                            <Input
                                placeholder="Search people..."
                                className="h-10 rounded-xl bg-white/5 border-white/5 pl-9 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>

                        <ScrollArea className="h-[250px] -mx-2 px-2">
                            <div className="grid gap-1">
                                {!users ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />
                                    ))
                                ) : (
                                    users.map(user => (
                                        <button
                                            key={user._id}
                                            onClick={() => toggleUser(user._id)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-2xl transition-all text-left group",
                                                selectedUsers.includes(user._id) ? "bg-primary/20 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                                            )}
                                        >
                                            <Avatar className="h-10 w-10 border border-white/10">
                                                <AvatarImage src={user.image} />
                                                <AvatarFallback className="text-xs font-bold bg-primary/10">{user.name[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate text-white">{user.name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                            <div className={cn(
                                                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                selectedUsers.includes(user._id) ? "bg-primary border-primary" : "border-white/10 group-hover:border-white/20"
                                            )}>
                                                {selectedUsers.includes(user._id) && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex gap-3">
                    <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 rounded-2xl h-12 font-bold bg-gradient-to-tr from-primary to-primary/60 shadow-lg shadow-primary/20"
                        onClick={handleCreate}
                        disabled={!name.trim() || selectedUsers.length === 0}
                    >
                        Create Group
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
