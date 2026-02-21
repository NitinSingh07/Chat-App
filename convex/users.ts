import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        image: v.string(),
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                name: args.name,
                email: args.email,
                image: args.image,
            });
            return existingUser._id;
        }

        const userId = await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            image: args.image,
            clerkId: args.clerkId,
            isOnline: true,
            lastSeen: Date.now(),
        });

        return userId;
    },
});

export const getMe = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});

export const listAll = query({
    args: { search: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const users = await ctx.db.query("users").collect();

        return users
            .filter((user) => user.clerkId !== identity.subject)
            .filter((user) =>
                !args.search ||
                user.name.toLowerCase().includes(args.search.toLowerCase())
            );
    },
});

export const setStatus = mutation({
    args: { isOnline: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                isOnline: args.isOnline,
                lastSeen: Date.now(),
            });
        }
    },
});
