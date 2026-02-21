"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useSyncUser } from "@/hooks/useSyncUser";
import { ConversationList } from "@/components/chat/ConversationList";
import { UserSearch } from "@/components/chat/UserSearch";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { PresenceHandler } from "@/components/PresenceHandler";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

export default function Home() {
  useSyncUser();
  const [selectedConversationId, setSelectedConversationId] = useState<any>(null);

  return (
    <main className="flex h-full bg-background overflow-hidden relative">
      <PresenceHandler />

      {/* Top-right user avatar — always visible */}
      <SignedIn>
        <div className="fixed top-3 right-4 z-50">
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>

      {/* Sidebar */}
      <div
        className={cn(
          "w-full md:w-[300px] border-r border-border flex flex-col shrink-0 bg-card",
          selectedConversationId ? "hidden md:flex" : "flex"
        )}
      >
        {/* Sidebar Header */}
        <div className="px-4 py-3.5 border-b border-border flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-base font-bold tracking-tight">TARS Chat</h1>
        </div>

        {/* Search + Conversations */}
        <SignedIn>
          <UserSearch onSelect={(id) => setSelectedConversationId(id)} />
          <div className="flex-1 overflow-hidden">
            <ConversationList
              selectedId={selectedConversationId}
              onSelect={(id) => setSelectedConversationId(id)}
            />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Welcome to TARS Chat</p>
              <p className="text-xs text-muted-foreground mt-1">Sign in to start messaging</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <SignInButton mode="modal">
                <button className="w-full text-sm font-medium border border-border rounded-xl py-2 hover:bg-accent transition-colors">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full text-sm font-medium bg-primary text-primary-foreground rounded-xl py-2 hover:opacity-90 transition-opacity">Sign Up</button>
              </SignUpButton>
            </div>
          </div>
        </SignedOut>
      </div>

      {/* Main Chat Area */}
      <div
        className={cn(
          "flex-1 min-w-0 transition-all",
          !selectedConversationId ? "hidden md:flex" : "flex"
        )}
      >
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-4 p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Select a conversation</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Search for a user above or pick an existing conversation to start chatting.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
