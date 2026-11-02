'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Group, Message, User, OnlineUser } from '@/modules/core/types';
import { chatService } from './chat.service';
import {
  isDirectGroup,
  getDirectPartner,
  getGroupDisplayName,
} from '@/modules/groups/groups.service';
import { getSocket } from '@/modules/core/socket-client';
import {
  Hash,
  Send,
  Info,
  Users,
  Check,
  CheckCheck,
  Smile,
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  Terminal,
  Loader2,
  UserPlus,
  MessageSquare,
} from 'lucide-react';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import ChannelDetailsDrawer from '@/modules/groups/channel-details-drawer';
import AddMemberModal from '@/modules/groups/add-member-modal';

interface ChannelChatViewProps {
  channel: Group;
  initialMessages: Message[];
  currentUser: User | null;
  onlineUsers?: OnlineUser[];
}

export default function ChannelChatView({
  channel,
  initialMessages,
  currentUser,
  onlineUsers: propOnlineUsers,
}: ChannelChatViewProps) {
  const { groups, onlineUsers: contextOnlineUsers } = useWorkspace();
  const onlineUsers = propOnlineUsers || contextOnlineUsers;
  const activeGroup = groups.find((g) => g._id === channel._id) || channel;
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isDirect = isDirectGroup(activeGroup);
  const directPartner = isDirect
    ? getDirectPartner(activeGroup, currentUser)
    : null;
  const displayName = getGroupDisplayName(activeGroup, currentUser);
  const isPartnerOnline = Boolean(
    directPartner && onlineUsers.some((u) => u.userId === directPartner._id)
  );

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    setMessages(initialMessages || []);
    scrollToBottom(false);
  }, [channel._id, initialMessages]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  useEffect(() => {
    if (!currentUser) return;

    const socket = getSocket(currentUser);
    if (!socket) return;

    chatService.setActiveGroup(currentUser, channel._id);

    const unreadMessageIds = messages
      .filter((m) => m.sender?._id && m.sender._id !== currentUser._id)
      .map((m) => m._id);

    if (unreadMessageIds.length > 0) {
      chatService.markAsRead(currentUser, channel._id, unreadMessageIds);
    }

    const handleNewMessage = (newMsg: Message) => {
      const msgGroupId =
        typeof newMsg.group === 'string' ? newMsg.group : newMsg.group?._id;
      if (msgGroupId === channel._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender?._id && newMsg.sender._id !== currentUser._id) {
          chatService.markAsRead(currentUser, channel._id, [newMsg._id]);
        }
      }
    };

    const handleUpdateMessage = (updatedMessages: Message[]) => {
      if (!Array.isArray(updatedMessages)) return;
      setMessages((prev) => {
        const updateMap = new Map(updatedMessages.map((m) => [m._id, m]));
        return prev.map((m) => updateMap.get(m._id) || m);
      });
    };

    const handleTyping = (data: {
      groupId: string;
      username: string;
      isTyping: boolean;
    }) => {
      if (
        data.groupId === channel._id &&
        data.username !== currentUser.username
      ) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          if (data.isTyping) {
            next.add(data.username);
          } else {
            next.delete(data.username);
          }
          return next;
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('newMessage', handleNewMessage);
    socket.on('updateMessage', handleUpdateMessage);
    socket.on('typing', handleTyping);

    return () => {
      chatService.clearActiveGroup(currentUser);
      socket.off('new_message', handleNewMessage);
      socket.off('newMessage', handleNewMessage);
      socket.off('updateMessage', handleUpdateMessage);
      socket.off('typing', handleTyping);
    };
  }, [channel._id, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    if (currentUser) {
      chatService.emitTyping(currentUser, channel._id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        chatService.emitTyping(currentUser, channel._id, false);
      }, 2000);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || isSending || !currentUser) return;

    setIsSending(true);
    setInputText('');
    chatService.emitTyping(currentUser, channel._id, false);

    try {
      const createdMessage = await chatService.sendMessage(
        channel._id,
        content
      );
      setMessages((prev) => {
        if (prev.some((m) => m._id === createdMessage._id)) return prev;
        return [...prev, createdMessage];
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setInputText(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderDeliveryStatus = (msg: Message) => {
    if (msg.sender?._id !== currentUser?._id) return null;

    if (!msg.deliveries || msg.deliveries.length === 0) {
      return (
        <span
          title="Sent"
          className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400"
        >
          <Check className="w-3.5 h-3.5 text-zinc-400" />
        </span>
      );
    }

    const recipientDeliveries = msg.deliveries.filter((d) => {
      const dUserId = typeof d.user === 'string' ? d.user : d.user?._id;
      return dUserId !== currentUser._id;
    });

    const isReadByAny = recipientDeliveries.some((d) => d.status === 'read');
    if (isReadByAny) {
      return (
        <span
          title="Read"
          className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-600"
        >
          <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>read</span>
        </span>
      );
    }

    const isDeliveredByAny = recipientDeliveries.some(
      (d) => d.status === 'delivered'
    );
    if (isDeliveredByAny) {
      return (
        <span
          title="Delivered"
          className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500"
        >
          <CheckCheck className="w-3.5 h-3.5 text-zinc-500" />
          <span>delivered</span>
        </span>
      );
    }

    return (
      <span
        title="Sent"
        className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400"
      >
        <Check className="w-3.5 h-3.5 text-zinc-400" />
        <span>sent</span>
      </span>
    );
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const typingArray = Array.from(typingUsers);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 px-6 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 truncate">
          {isDirect ? (
            <div className="flex items-center gap-2.5 truncate">
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-[6px] bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-[2px] border border-white ${
                    isPartnerOnline ? 'bg-emerald-600' : 'bg-zinc-300'
                  }`}
                />
              </div>
              <span className="font-bold text-sm text-zinc-950 truncate">
                @{displayName}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] border ${
                  isPartnerOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                }`}
              >
                {isPartnerOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              {directPartner?.email && (
                <span className="text-xs text-zinc-400 border-l border-zinc-200 pl-3 hidden sm:inline truncate">
                  {directPartner.email}
                </span>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-zinc-950 font-bold text-sm tracking-tight truncate">
                <Hash className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="truncate">{activeGroup.name}</span>
              </div>

              {activeGroup.description && (
                <span className="text-xs text-zinc-500 border-l border-zinc-200 pl-3 truncate max-w-md hidden sm:inline">
                  {activeGroup.description}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isDirect && (
            <button
              type="button"
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 text-xs font-medium border border-zinc-200 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-zinc-600" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium border transition-colors cursor-pointer ${
              isDrawerOpen
                ? 'bg-zinc-950 text-white border-zinc-950'
                : 'bg-[#fafafa] hover:bg-zinc-100 text-zinc-800 border-zinc-200'
            }`}
          >
            {isDirect ? (
              <>
                <Info className="w-3.5 h-3.5" />
                <span>Profile</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5" />
                <span className="font-mono">
                  {activeGroup.members?.length || 0}
                </span>
                <Info className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Feed + Optional Inspector Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2.5">
            {/* Intro Banner */}
            <div className="p-4 rounded-[8px] bg-[#fafafa] border border-zinc-200 mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[6px] bg-white border border-zinc-200 text-zinc-950 flex items-center justify-center shrink-0 font-bold text-sm">
                  {isDirect ? (
                    displayName.charAt(0).toUpperCase()
                  ) : (
                    <Hash className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h1 className="text-base font-bold text-zinc-950">
                    {isDirect
                      ? `Direct conversation with @${displayName}`
                      : `Welcome to #${activeGroup.name}`}
                  </h1>
                  <p className="text-xs text-zinc-600 mt-0.5 max-w-xl">
                    {isDirect
                      ? `This is your private 1-to-1 message history with @${displayName}. Messages include real-time delivery and read receipts.`
                      : activeGroup.description ||
                        `This is the start of the #${activeGroup.name} channel. Messages are synced in real time via Socket.IO with per-member read receipts.`}
                  </p>
                </div>
              </div>
              {!isDirect && (
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="px-3 py-1.5 rounded-[6px] bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-900 shrink-0 cursor-pointer"
                >
                  + Add Teammates
                </button>
              )}
            </div>

            {/* Messages */}
            {messages.length > 0 ? (
              messages.map((msg, index) => {
                const isNotification = msg.type === 'notification';

                if (isNotification) {
                  return (
                    <div
                      key={msg._id || index}
                      className="flex items-center justify-center my-2"
                    >
                      <div className="px-3 py-1 rounded-[4px] bg-[#fafafa] border border-zinc-200 text-[11px] font-mono text-zinc-600 flex items-center gap-2">
                        <Terminal className="w-3 h-3 text-zinc-500" />
                        <span>{msg.content}</span>
                        <span className="text-[10px] text-zinc-400">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                }

                const isMe = msg.sender?._id === currentUser?._id;
                const senderInitial = msg.sender?.username
                  ? msg.sender.username.charAt(0).toUpperCase()
                  : 'U';

                return (
                  <div
                    key={msg._id || index}
                    className={`flex items-start gap-3 p-3 rounded-[6px] border transition-colors ${
                      isMe
                        ? 'bg-[#fafafa] border-zinc-200'
                        : 'bg-white border-zinc-200/70 hover:border-zinc-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-[6px] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                        isMe
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-zinc-100 text-zinc-900 border-zinc-200'
                      }`}
                    >
                      {senderInitial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-950">
                          @{msg.sender?.username || 'user'}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-zinc-200/80 text-zinc-800 font-medium">
                            YOU
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-zinc-400">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>

                      <div className="text-sm text-zinc-800 leading-relaxed break-words whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {renderDeliveryStatus(msg)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-[6px] bg-[#fafafa]">
                {isDirect
                  ? `No messages with @${displayName} yet. Say hello below!`
                  : `No messages in #${activeGroup.name} yet. Send the first message below.`}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {typingArray.length > 0 && (
            <div className="px-6 py-1.5 text-xs font-mono text-zinc-600 flex items-center gap-2 bg-[#fafafa] border-t border-zinc-200">
              <span className="w-2 h-2 rounded-[2px] bg-blue-600 animate-pulse" />
              <span>
                {typingArray.join(', ')}{' '}
                {typingArray.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}

          {/* Composer */}
          <div className="p-4 bg-[#fafafa] border-t border-zinc-200">
            <form
              onSubmit={handleSendMessage}
              className="bg-white border border-zinc-200 focus-within:border-zinc-900 rounded-[8px] transition-colors overflow-hidden"
            >
              <div className="p-3">
                <textarea
                  rows={2}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isDirect
                      ? `Message @${displayName}... (Enter to send, Shift+Enter for newline)`
                      : `Message #${activeGroup.name}... (Enter to send, Shift+Enter for newline)`
                  }
                  className="w-full bg-transparent text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="px-3 py-2 bg-[#fafafa] border-t border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-1 text-zinc-500">
                  <button
                    type="button"
                    title="Bold"
                    onClick={() => setInputText((prev) => prev + '**bold**')}
                    className="p-1.5 rounded-[4px] hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Italic"
                    onClick={() => setInputText((prev) => prev + '_italic_')}
                    className="p-1.5 rounded-[4px] hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Code"
                    onClick={() => setInputText((prev) => prev + '`code`')}
                    className="p-1.5 rounded-[4px] hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Link"
                    onClick={() => setInputText((prev) => prev + '[link](url)')}
                    className="p-1.5 rounded-[4px] hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Reaction"
                    onClick={() => setInputText((prev) => prev + ' 👍')}
                    className="p-1.5 rounded-[4px] hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-3.5 py-1.5 rounded-[6px] text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-950 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <ChannelDetailsDrawer
          channel={activeGroup}
          currentUser={currentUser}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onlineUsers={onlineUsers}
        />
      </div>

      {!isDirect && (
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          channel={activeGroup}
        />
      )}
    </div>
  );
}
