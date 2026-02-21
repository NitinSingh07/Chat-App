import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const participants = [me._id, args.otherUserId].sort();

        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_participants", (q) => q.eq("participants", participants))
            .unique();

        if (existing) return existing._id;

        return await ctx.db.insert("conversations", {
            participants,
        });
    },
});

export const createGroup = mutation({
    args: {
        name: v.string(),
        participantIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const participants = [...new Set([...args.participantIds, me._id])];

        return await ctx.db.insert("conversations", {
            participants,
            name: args.name,
            isGroup: true,
            adminId: me._id,
        });
    },
});

export const updateGroup = mutation({
    args: {
        conversationId: v.id("conversations"),
        name: v.optional(v.string()),
        participantIds: v.optional(v.array(v.id("users"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        if (!conversation.isGroup) throw new Error("Not a group conversation");
        if (conversation.adminId !== me._id) throw new Error("Only admin can update group");

        const patches: any = {};
        if (args.name) {
            patches.name = args.name;
            if (conversation.name !== args.name) {
                await ctx.db.insert("messages", {
                    conversationId: args.conversationId,
                    senderId: me._id,
                    content: `${me.name} changed the group name to "${args.name}"`,
                    createdAt: Date.now(),
                    isRead: true,
                    isSystem: true,
                });
            }
        }

        if (args.participantIds) {
            // Ensure admin is always in participants
            const newParticipants = [...new Set([...args.participantIds, me._id])];
            patches.participants = newParticipants;

            // Check for added/removed members to trigger system messages
            const added = newParticipants.filter(id => !conversation.participants.includes(id));
            const removed = conversation.participants.filter(id => !newParticipants.includes(id));

            for (const id of added) {
                const addedUser = await ctx.db.get(id);
                if (addedUser) {
                    await ctx.db.insert("messages", {
                        conversationId: args.conversationId,
                        senderId: me._id,
                        content: `${me.name} added ${addedUser.name}`,
                        createdAt: Date.now(),
                        isRead: true,
                        isSystem: true,
                    });
                }
            }

            for (const id of removed) {
                const removedUser = await ctx.db.get(id);
                if (removedUser) {
                    await ctx.db.insert("messages", {
                        conversationId: args.conversationId,
                        senderId: me._id,
                        content: `${me.name} removed ${removedUser.name}`,
                        createdAt: Date.now(),
                        isRead: true,
                        isSystem: true,
                    });
                }
            }
        }

        await ctx.db.patch(args.conversationId, patches);
    },
});

export const leaveGroup = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        if (!conversation.isGroup) throw new Error("Not a group conversation");

        // Cannot leave if you are the admin (unless we handle admin transfer, but for now we block)
        if (conversation.adminId === me._id) {
            throw new Error("Admin cannot leave the group. Reassign admin first.");
        }

        const newParticipants = conversation.participants.filter(id => id !== me._id);

        await ctx.db.patch(args.conversationId, {
            participants: newParticipants
        });

        // Insert system message indicating departure
        await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: me._id,
            content: `${me.name} left the group`,
            createdAt: Date.now(),
            isRead: true,
            isSystem: true,
        });
    },
});

export const list = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) return [];

        const conversations = await ctx.db.query("conversations").collect();

        const myConversations = conversations.filter((c) =>
            c.participants.includes(me._id)
        );

        const detailedConversations = await Promise.all(
            myConversations.map(async (conv) => {
                let otherUser = null;
                if (!conv.isGroup) {
                    const otherUserId = conv.participants.find((id) => id !== me._id);
                    otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;
                }

                const lastMessage = conv.lastMessageId
                    ? await ctx.db.get(conv.lastMessageId)
                    : null;

                const unreadCount = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
                    .filter((q) => q.and(
                        q.neq(q.field("senderId"), me._id),
                        q.eq(q.field("isRead"), false)
                    ))
                    .collect();

                return {
                    ...conv,
                    otherUser,
                    lastMessage,
                    unreadCount: unreadCount.length,
                    memberCount: conv.participants.length,
                };
            })
        );

        return detailedConversations.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt ?? 0;
            const timeB = b.lastMessage?.createdAt ?? 0;
            return timeB - timeA;
        });
    },
});
