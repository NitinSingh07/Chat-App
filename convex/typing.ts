import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const set = mutation({
    args: {
        conversationId: v.id("conversations"),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) return;

        const existing = await ctx.db
            .query("typingStatus")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.eq(q.field("userId"), me._id))
            .unique();

        if (args.isTyping) {
            if (existing) {
                await ctx.db.patch(existing._id, {
                    expiresAt: Date.now() + 3000,
                });
            } else {
                await ctx.db.insert("typingStatus", {
                    conversationId: args.conversationId,
                    userId: me._id,
                    expiresAt: Date.now() + 3000,
                });
            }
        } else if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});

export const get = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        const statuses = await ctx.db
            .query("typingStatus")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        const activeStatuses = statuses.filter(
            (s) => s.expiresAt > Date.now() && s.userId !== me?._id
        );

        return await Promise.all(
            activeStatuses.map(async (s) => {
                const user = await ctx.db.get(s.userId);
                return user?.name ?? "Someone";
            })
        );
    },
});
