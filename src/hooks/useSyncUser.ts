"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function useSyncUser() {
    const { user, isLoaded } = useUser();
    const storeUser = useMutation(api.users.store);

    useEffect(() => {
        if (isLoaded && user) {
            storeUser({
                name: user.fullName ?? user.username ?? "Anonymous",
                email: user.emailAddresses[0]?.emailAddress ?? "",
                image: user.imageUrl,
                clerkId: user.id,
            });
        }
    }, [isLoaded, user, storeUser]);
}
