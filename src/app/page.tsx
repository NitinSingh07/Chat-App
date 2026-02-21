"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useSyncUser } from "@/hooks/useSyncUser";
import { ConversationList } from "@/components/chat/ConversationList";
import { UserSearch } from "@/components/chat/UserSearch";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { PresenceHandler } from "@/components/PresenceHandler";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus } from "lucide-react";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  useSyncUser();
  const [selectedConversationId, setSelectedConversationId] = useState<any>(null);

  return (
    <main className="flex h-full bg-background overflow-hidden relative premium-gradient">
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
          "w-full md:w-[320px] border-r border-white/5 flex flex-col shrink-0 glass-sidebar relative",
          selectedConversationId ? "hidden md:flex" : "flex"
        )}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <h1 className="text-lg font-bold tracking-tight text-white">TARS Chat</h1>
          </div>
        </div>

        {/* Search + Conversations */}
        <SignedIn>
          <div className="flex-1 flex flex-col min-h-0 relative">
            <UserSearch onSelect={(id) => setSelectedConversationId(id)} />
            <div className="flex-1 overflow-hidden">
              <ConversationList
                selectedId={selectedConversationId}
                onSelect={(id) => setSelectedConversationId(id)}
              />
            </div>

            {/* Create Group Floating Button */}
            <div className="absolute bottom-8 right-8 z-30">
              <CreateGroupDialog onSelect={(id) => setSelectedConversationId(id)}>
                <Button
                  size="icon"
                  className="h-16 w-16 rounded-[2rem] bg-gradient-to-tr from-indigo-500 via-primary to-violet-500 shadow-[0_20px_50px_rgba(79,70,229,0.4)] hover:shadow-[0_25px_60px_rgba(79,70,229,0.5)] hover:scale-110 active:scale-95 transition-all duration-500 group border border-white/20"
                >
                  <Plus className="h-8 w-8 text-white transition-transform duration-500 group-hover:rotate-[360deg] stroke-[2.5px]" />
                </Button>
              </CreateGroupDialog>
            </div>
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
