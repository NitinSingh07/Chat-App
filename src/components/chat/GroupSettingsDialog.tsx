"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Settings, UserMinus, UserPlus, X, Edit2, Shield, User, Info, Users as UsersIcon, LogOut } from "lucide-react";
import { GroupAvatar } from "./GroupAvatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface GroupSettingsDialogProps {
    conversationId: any;
    currentName: string;
    currentParticipants: any[];
    adminId: any;
}

export function GroupSettingsDialog({ conversationId, currentName, currentParticipants, adminId }: GroupSettingsDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(currentName);
    const [isEditingName, setIsEditingName] = useState(false);
    const [search, setSearch] = useState("");

    const allUsers = useQuery(api.users.listAll, open ? { search } : "skip");
    const updateGroup = useMutation(api.conversations.updateGroup);
    const leaveGroup = useMutation(api.conversations.leaveGroup);
    const me = useQuery(api.users.getMe);

    const isAdmin = me?._id === adminId;

    const handleUpdateName = async () => {
        if (!name.trim() || name === currentName) {
            setIsEditingName(false);
            return;
        }
        try {
            await updateGroup({ conversationId, name });
            toast.success("Group name updated");
            setIsEditingName(false);
        } catch (error) {
            toast.error("Failed to update name");
        }
    };

    const handleAddMember = async (userId: any) => {
        try {
            const newParticipants = [...currentParticipants, userId];
            await updateGroup({ conversationId, participantIds: newParticipants });
            toast.success("Member added");
        } catch (error) {
            toast.error("Failed to add member");
        }
    };

    const handleRemoveMember = async (userId: any) => {
        try {
            const newParticipants = currentParticipants.filter(id => id !== userId);
            await updateGroup({ conversationId, participantIds: newParticipants });
            toast.success("Member removed");
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    const handleLeaveGroup = async () => {
        try {
            await leaveGroup({ conversationId });
            toast.success("You left the group");
            setOpen(false);
        } catch (error) {
            toast.error("Failed to leave group");
        }
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-white/5 rounded-xl">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden glass-card border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
                <DialogTitle className="sr-only">Group Settings</DialogTitle>
                {/* Hero Section */}
                <div className="relative h-44 bg-gradient-to-br from-indigo-600/20 via-primary/10 to-violet-600/20 flex flex-col items-center justify-center border-b border-white/5 pb-6">
                    <div className="absolute top-4 right-4 text-white/20">
                        <UsersIcon className="h-24 w-24 rotate-12" />
                    </div>

                    <div className="relative z-10 text-center space-y-4 pt-8">
                        <GroupAvatar
                            participantIds={currentParticipants}
                            size="lg"
                            className="scale-125 mb-2 drop-shadow-2xl"
                        />
                        <div className="space-y-1 mt-4">
                            {isEditingName && isAdmin ? (
                                <div className="flex items-center gap-2 justify-center px-6">
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-10 rounded-xl bg-white/10 border-white/20 text-center font-bold text-white text-lg"
                                        autoFocus
                                    />
                                    <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600" onClick={handleUpdateName}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => { setName(currentName); setIsEditingName(false); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 group/name">
                                    <h2 className="text-2xl font-black text-white tracking-tight">{currentName}</h2>
                                    {isAdmin && (
                                        <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover/name:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg text-primary">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center justify-center gap-2">
                                <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-white/10 font-bold px-2.5 py-0.5">
                                    {currentParticipants.length} MEMBERS
                                </Badge>
                                {isAdmin && (
                                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 font-bold px-2.5 py-0.5">
                                        ADMIN
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    {/* Management Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Info className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">About Group</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {/* Members List */}
                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <span className="text-sm font-bold text-white px-1">Participant List</span>
                                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <ScrollArea className="max-h-[220px] p-2">
                                    <div className="space-y-1">
                                        {currentParticipants.map(participantId => (
                                            <MemberItem
                                                key={participantId}
                                                userId={participantId}
                                                isAdmin={participantId === adminId}
                                                canRemove={isAdmin && participantId !== me?._id}
                                                onRemove={handleRemoveMember}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Add Members Section */}
                            {isAdmin && (
                                <div className="space-y-3 pt-2">
                                    <div className="relative">
                                        <Input
                                            placeholder="Find people to invite..."
                                            className="h-11 rounded-2xl bg-white/5 border-white/10 pl-10 text-sm focus:ring-primary/20 transition-all font-medium"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <UserPlus className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <ScrollArea className="max-h-[140px] border border-white/5 rounded-2xl bg-white/[0.02] p-2">
                                        <div className="space-y-1">
                                            {allUsers?.filter(u => !currentParticipants.includes(u._id)).map(user => (
                                                <button
                                                    key={user._id}
                                                    onClick={() => handleAddMember(user._id)}
                                                    className="flex w-full items-center gap-3 p-2 rounded-xl hover:bg-primary/10 transition-all text-left group"
                                                >
                                                    <Avatar className="h-8 w-8 border border-white/10 shadow-md">
                                                        <AvatarImage src={user.image} />
                                                        <AvatarFallback className="text-[10px] font-bold">{user.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold truncate text-white">{user.name}</p>
                                                    </div>
                                                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                        <UserPlus className="h-3 w-3 text-primary" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}

                            {/* Leave Group Section */}
                            {!isAdmin && (
                                <div className="pt-2 border-t border-white/5 mt-4">
                                    <button
                                        onClick={handleLeaveGroup}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold transition-all group"
                                    >
                                        <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                        Leave Group
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function MemberItem({ userId, isAdmin, canRemove, onRemove }: { userId: any, isAdmin: boolean, canRemove: boolean, onRemove: (id: any) => void }) {
    const users = useQuery(api.users.getByIds, { ids: [userId] });
    const userData = users?.[0];

    if (!userData) return <div className="h-12 animate-pulse bg-white/5 rounded-2xl mb-1.5" />;

    return (
        <div className="flex items-center gap-3 p-2.5 rounded-2xl group hover:bg-white/5 transition-all mb-1.5 border border-transparent hover:border-white/5">
            <div className="relative">
                <Avatar className="h-10 w-10 border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
                    <AvatarImage src={userData.image} />
                    <AvatarFallback className="text-xs font-bold bg-primary/20">{userData.name?.[0]}</AvatarFallback>
                </Avatar>
                {isAdmin && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center border-2 border-[#1a1c2e] shadow-xl">
                        <Shield className="h-2 w-2 text-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate text-white">{userData.name}</p>
                    {isAdmin && (
                        <span className="text-[8px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">Admin</span>
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium truncate">
                    {isAdmin ? "Group Administrator" : "Participant"}
                </p>
            </div>
            {canRemove && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                    onClick={() => onRemove(userId)}
                >
                    <UserMinus className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
