"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface GroupAvatarProps {
    participantIds: any[];
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function GroupAvatar({ participantIds, className, size = "md" }: GroupAvatarProps) {
    const users = useQuery(api.users.getByIds, { ids: participantIds.slice(0, 3) });

    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-14 w-14"
    };

    const itemSizeClasses = {
        sm: "h-5 w-5 -ml-1",
        md: "h-8 w-8 -ml-2",
        lg: "h-10 w-10 -ml-3"
    };

    if (!users || users.length === 0) {
        return (
            <div className={cn(sizeClasses[size], "rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center border border-white/10 shadow-lg", className)}>
                <span className="text-white font-bold opacity-50">?</span>
            </div>
        );
    }

    // Single user (shouldn't really happen for groups but fallback)
    if (users.length === 1) {
        return (
            <Avatar className={cn(sizeClasses[size], "border border-white/10 shadow-lg", className)}>
                <AvatarImage src={users[0]?.image} />
                <AvatarFallback>{users[0]?.name?.[0]}</AvatarFallback>
            </Avatar>
        );
    }

    return (
        <div className={cn("flex items-center justify-center", className)}>
            <div className="flex items-center h-full">
                {users.map((user, idx) => (
                    <Avatar
                        key={user?._id}
                        className={cn(
                            itemSizeClasses[size],
                            "border-2 border-[#1a1c2e] shadow-xl relative transition-transform hover:z-10 hover:scale-110",
                            idx === 0 ? "ml-0" : ""
                        )}
                        style={{ zIndex: users.length - idx }}
                    >
                        <AvatarImage src={user?.image} />
                        <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-white">
                            {user?.name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                ))}
            </div>
        </div>
    );
}
