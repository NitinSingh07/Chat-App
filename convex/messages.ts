import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: me._id,
            content: args.content,
            createdAt: Date.now(),
            isRead: false,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
        });

        return messageId;
    },
});

export const list = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("asc")
            .collect();
    },
});

export const markRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) return;

        const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.and(
                q.neq(q.field("senderId"), me._id),
                q.eq(q.field("isRead"), false)
            ))
            .collect();

        for (const msg of unreadMessages) {
            await ctx.db.patch(msg._id, { isRead: true });
        }
    },
});
