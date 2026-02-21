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
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("asc")
            .collect();

        return await Promise.all(
            messages.map(async (msg) => {
                const user = await ctx.db.get(msg.senderId);
                return {
                    ...msg,
                    content: msg.isDeleted ? "This message was deleted" : msg.content,
                    senderName: user?.name,
                    senderImage: user?.image,
                };
            })
        );
    },
});

export const remove = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        if (message.senderId !== me._id) {
            throw new Error("Unauthorized to delete this message");
        }

        await ctx.db.patch(args.messageId, {
            isDeleted: true,
        });
    },
});

export const toggleReaction = mutation({
    args: { messageId: v.id("messages"), emoji: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const reactions = message.reactions || [];
        const existingIndex = reactions.findIndex(
            (r) => r.userId === me._id && r.emoji === args.emoji
        );

        let newReactions;
        if (existingIndex > -1) {
            // Remove reaction
            newReactions = reactions.filter((_, i) => i !== existingIndex);
        } else {
            // Add reaction
            newReactions = [...reactions, { userId: me._id, emoji: args.emoji }];
        }

        await ctx.db.patch(args.messageId, {
            reactions: newReactions,
        });
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
