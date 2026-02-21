import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.string(),
    clerkId: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    lastMessageId: v.optional(v.id("messages")),
    name: v.optional(v.string()),
    isGroup: v.optional(v.boolean()),
    adminId: v.optional(v.id("users")),
    groupImage: v.optional(v.string()),
  }).index("by_participants", ["participants"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    isRead: v.boolean(),
    isDeleted: v.optional(v.boolean()),
    reactions: v.optional(v.array(v.object({ userId: v.id("users"), emoji: v.string() }))),
  }).index("by_conversation", ["conversationId"]),

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    expiresAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
