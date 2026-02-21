"use client";

import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function PresenceHandler() {
    const setStatus = useMutation(api.users.setStatus);

    useEffect(() => {
        setStatus({ isOnline: true });

        const handleVisibilityChange = () => {
            setStatus({ isOnline: document.visibilityState === "visible" });
        };

        const handleBeforeUnload = () => {
            // Small delay might not work here, usually heartbeats are better
            setStatus({ isOnline: false });
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [setStatus]);

    return null;
}
