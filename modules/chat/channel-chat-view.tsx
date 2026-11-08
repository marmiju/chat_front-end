'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Group, Message, User, OnlineUser } from '@/modules/core/types';
import { chatService } from './chat.service';
import {
  groupsService,
  isDirectGroup,
  getDirectPartner,
  getGroupDisplayName,
} from '@/modules/groups/groups.service';
import { getSocket } from '@/modules/core/socket-client';
import {
  Hash,
  ArrowUp,
  Info,
  Check,
  CheckCheck,
  Smile,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import UserAvatar from '@/modules/core/user-avatar';
import ChannelDetailsDrawer from '@/modules/groups/channel-details-drawer';
import AddMemberModal from '@/modules/groups/add-member-modal';

interface ChannelChatViewProps {
  channel: Group;
  initialMessages: Message[];
  currentUser: User | null;
  onlineUsers?: OnlineUser[];
}

const QUICK_EMOJIS = ['👍', '❤️', '🎉', '🔥', '😂', '🙌'];

export default function ChannelChatView({
  channel,
  initialMessages,
  currentUser: propCurrentUser,
  onlineUsers: propOnlineUsers,
}: ChannelChatViewProps) {
  const {
    groups,
    updateGroup,
    currentUser: contextCurrentUser,
    onlineUsers: contextOnlineUsers,
  } = useWorkspace();
  const currentUser = contextCurrentUser || propCurrentUser;
  const onlineUsers = propOnlineUsers || contextOnlineUsers;
  const activeGroup = groups.find((g) => g._id === channel._id) || channel;
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markedReadIdsRef = useRef<Set<string>>(new Set());

  const isDirect = isDirectGroup(activeGroup);
  const directPartner = isDirect
    ? getDirectPartner(activeGroup, currentUser)
    : null;
  const displayName = getGroupDisplayName(activeGroup, currentUser);
  const partnerDisplayTitle =
    directPartner?.displayName || `@${displayName}`;
  const isPartnerOnline = Boolean(
    directPartner &&
      onlineUsers.some((u) => String(u.userId) === String(directPartner._id))
  );

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    markedReadIdsRef.current.clear();
    setMessages(initialMessages || []);
    scrollToBottom(false);

    let cancelled = false;
    chatService
      .getMessages(channel._id, 100)
      .then((fresh) => {
        if (!cancelled && Array.isArray(fresh)) {
          setMessages([...fresh].reverse());
        }
      })
      .catch(() => {});

    groupsService
      .getGroupById(channel._id)
      .then((freshGroup) => {
        if (!cancelled && freshGroup?._id) {
          updateGroup(freshGroup);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [channel._id, initialMessages, updateGroup]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Automatically mark unread messages from other users as 'read' in real time
  useEffect(() => {
    if (!currentUser?._id || !messages.length) return;
    const myId = String(currentUser._id);

    const unreadIds = messages
      .filter((m) => {
        if (m.type === 'notification') return false;
        const msgGroupId =
          typeof m.group === 'string' ? m.group : m.group?._id;
        if (msgGroupId && String(msgGroupId) !== String(channel._id)) {
          return false;
        }
        const senderId = m.sender?._id ? String(m.sender._id) : '';
        if (!senderId || senderId === myId) return false;

        const myDelivery = m.deliveries?.find((d) => {
          const dUserId = typeof d.user === 'string' ? d.user : d.user?._id;
          return String(dUserId) === myId;
        });

        return myDelivery?.status !== 'read';
      })
      .map((m) => String(m._id))
      .filter((id) => !markedReadIdsRef.current.has(id));

    if (unreadIds.length > 0) {
      unreadIds.forEach((id) => markedReadIdsRef.current.add(id));
      chatService.markAsRead(currentUser, channel._id, unreadIds);
    }
  }, [channel._id, currentUser, messages]);

  useEffect(() => {
    if (!currentUser) return;

    const socket = getSocket(currentUser);
    if (!socket) return;

    const syncActiveRoom = () => {
      groupsService.joinGroupRoomSocket(currentUser, channel._id);
      chatService.setActiveGroup(currentUser, channel._id);
    };

    syncActiveRoom();

    const handleNewMessage = (newMsg: Message) => {
      const msgGroupId =
        typeof newMsg.group === 'string' ? newMsg.group : newMsg.group?._id;
      if (String(msgGroupId) === String(channel._id)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) {
            return prev;
          }
          return [...prev, newMsg];
        });

        if (
          newMsg.sender?._id &&
          String(newMsg.sender._id) !== String(currentUser._id)
        ) {
          markedReadIdsRef.current.add(String(newMsg._id));
          chatService.markAsRead(currentUser, channel._id, [
            String(newMsg._id),
          ]);
        }
      }
    };

    const statusRank: Record<string, number> = {
      sent: 1,
      delivered: 2,
      read: 3,
    };

    const mergeMessageDeliveries = (
      existingMsg: Message,
      incomingMsg: Message
    ): Message => {
      if (!existingMsg.deliveries?.length) return incomingMsg;
      if (!incomingMsg.deliveries?.length) return existingMsg;

      const mergedDeliveries = incomingMsg.deliveries.map((incD) => {
        const incUserId = String(
          typeof incD.user === 'string' ? incD.user : incD.user?._id
        );
        const prevD = existingMsg.deliveries?.find((d) => {
          const dUserId = String(
            typeof d.user === 'string' ? d.user : d.user?._id
          );
          return dUserId === incUserId;
        });

        if (
          prevD &&
          (statusRank[prevD.status] || 0) > (statusRank[incD.status] || 0)
        ) {
          return prevD;
        }
        return incD;
      });

      return {
        ...incomingMsg,
        deliveries: mergedDeliveries,
      };
    };

    const handleUpdateMessage = (updatedMessages: Message[]) => {
      if (!Array.isArray(updatedMessages) || updatedMessages.length === 0)
        return;
      setMessages((prev) => {
        const updateMap = new Map(
          updatedMessages.map((m) => [String(m._id), m])
        );
        return prev.map((m) => {
          const incoming = updateMap.get(String(m._id));
          if (!incoming) return m;
          return mergeMessageDeliveries(m, incoming);
        });
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

    const handleUserUpdated = (updatedUser: User) => {
      if (!updatedUser?._id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.sender?._id === updatedUser._id
            ? {
                ...m,
                sender: {
                  ...m.sender,
                  username: updatedUser.username || m.sender.username,
                  email: updatedUser.email || m.sender.email,
                  displayName: updatedUser.displayName,
                  avatar: updatedUser.avatar,
                  title: updatedUser.title,
                  statusText: updatedUser.statusText,
                },
              }
            : m
        )
      );
    };

    socket.on('connect', syncActiveRoom);
    socket.on('new_message', handleNewMessage);
    socket.on('newMessage', handleNewMessage);
    socket.on('updateMessage', handleUpdateMessage);
    socket.on('typing', handleTyping);
    socket.on('user_updated', handleUserUpdated);
    window.addEventListener('focus', syncActiveRoom);

    return () => {
      chatService.clearActiveGroup(currentUser);
      socket.off('connect', syncActiveRoom);
      socket.off('new_message', handleNewMessage);
      socket.off('newMessage', handleNewMessage);
      socket.off('updateMessage', handleUpdateMessage);
      socket.off('typing', handleTyping);
      socket.off('user_updated', handleUserUpdated);
      window.removeEventListener('focus', syncActiveRoom);
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
    setShowEmojiPicker(false);
    chatService.emitTyping(currentUser, channel._id, false);

    try {
      const createdMessage = await chatService.sendMessage(
        channel._id,
        content
      );
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(createdMessage._id)))
          return prev;
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
    if (String(msg.sender?._id) !== String(currentUser?._id)) return null;

    if (!msg.deliveries || msg.deliveries.length === 0) {
      return (
        <span title="Sent" className="inline-flex items-center text-zinc-400">
          <Check className="w-3.5 h-3.5" />
        </span>
      );
    }

    const recipientDeliveries = msg.deliveries.filter((d) => {
      const dUserId = typeof d.user === 'string' ? d.user : d.user?._id;
      return String(dUserId) !== String(currentUser?._id);
    });

    const isReadByAny = recipientDeliveries.some((d) => d.status === 'read');
    if (isReadByAny) {
      return (
        <span
          title="Seen"
          className="inline-flex items-center gap-0.5 text-[11px] text-blue-600"
        >
          <CheckCheck className="w-3.5 h-3.5" />
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
          className="inline-flex items-center text-zinc-400"
        >
          <CheckCheck className="w-3.5 h-3.5" />
        </span>
      );
    }

    return (
      <span title="Sent" className="inline-flex items-center text-zinc-400">
        <Check className="w-3.5 h-3.5" />
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

  const formatDateDivider = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return '';
    }
  };

  const typingArray = Array.from(typingUsers);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Minimalist Top Header */}
      <header className="h-14 px-6 border-b border-zinc-200/80 bg-white flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {isDirect ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar
                name={partnerDisplayTitle}
                avatar={directPartner?.avatar}
                size="sm"
                variant="subtle"
                isOnline={isPartnerOnline}
                showStatusDot={true}
              />
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm text-zinc-950 truncate">
                  {partnerDisplayTitle}
                </span>
                <span className="text-xs text-zinc-400 truncate hidden sm:inline">
                  {directPartner?.statusText ||
                    (isPartnerOnline ? 'Online' : 'Offline')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="font-semibold text-sm text-zinc-950 truncate">
                {activeGroup.name}
              </span>
              {activeGroup.description && (
                <span className="text-xs text-zinc-400 truncate max-w-md hidden sm:inline pl-2 border-l border-zinc-200">
                  {activeGroup.description}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isDirect && (
            <button
              type="button"
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 text-xs font-medium transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add people</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            title="Conversation details"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              isDrawerOpen
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isDirect
                ? 'Profile'
                : `${activeGroup.members?.length || 0} members`}
            </span>
          </button>
        </div>
      </header>

      {/* Main Conversation Stream + Optional Right Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-1">
              {/* Quiet Conversation Start Header */}
              <div className="pb-6 mb-4 border-b border-zinc-100">
                <div className="text-sm font-semibold text-zinc-900">
                  {isDirect
                    ? partnerDisplayTitle
                    : `#${activeGroup.name}`}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isDirect
                    ? `Start of your direct conversation with ${partnerDisplayTitle}.`
                    : activeGroup.description ||
                      `Start of #${activeGroup.name}.`}
                </p>
              </div>

              {/* Messages */}
              {messages.length > 0 ? (
                messages.map((msg, index) => {
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const currentDay = msg.createdAt
                    ? new Date(msg.createdAt).toDateString()
                    : '';
                  const prevDay = prevMsg?.createdAt
                    ? new Date(prevMsg.createdAt).toDateString()
                    : '';
                  const showDateDivider = currentDay && currentDay !== prevDay;

                  if (msg.type === 'notification') {
                    return (
                      <React.Fragment key={msg._id || index}>
                        {showDateDivider && (
                          <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-zinc-100" />
                            <span className="text-[11px] font-medium text-zinc-400">
                              {formatDateDivider(msg.createdAt)}
                            </span>
                            <div className="flex-1 h-px bg-zinc-100" />
                          </div>
                        )}
                        <div className="py-1.5 text-center text-xs text-zinc-400">
                          {msg.content}
                        </div>
                      </React.Fragment>
                    );
                  }

                  const isMe =
                    String(msg.sender?._id) === String(currentUser?._id);
                  const senderUser = isMe
                    ? { ...msg.sender, ...currentUser }
                    : activeGroup.members?.find(
                        (m) => String(m._id) === String(msg.sender?._id)
                      ) || msg.sender;

                  const isSameSenderAsPrev =
                    prevMsg &&
                    prevMsg.type !== 'notification' &&
                    String(prevMsg.sender?._id) === String(msg.sender?._id) &&
                    !showDateDivider &&
                    Math.abs(
                      new Date(msg.createdAt).getTime() -
                        new Date(prevMsg.createdAt).getTime()
                    ) <
                      5 * 60 * 1000;

                  const senderLabel =
                    senderUser?.displayName ||
                    senderUser?.username ||
                    'User';

                  return (
                    <React.Fragment key={msg._id || index}>
                      {showDateDivider && (
                        <div className="flex items-center gap-3 my-5">
                          <div className="flex-1 h-px bg-zinc-100" />
                          <span className="text-[11px] font-medium text-zinc-400">
                            {formatDateDivider(msg.createdAt)}
                          </span>
                          <div className="flex-1 h-px bg-zinc-100" />
                        </div>
                      )}

                      <div
                        className={`group flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-zinc-50/80 transition-colors ${
                          isSameSenderAsPrev ? 'mt-0.5' : 'mt-3.5'
                        }`}
                      >
                        {isSameSenderAsPrev ? (
                          <div className="w-8 shrink-0 text-[10px] text-zinc-300 opacity-0 group-hover:opacity-100 text-right pt-1 select-none">
                            {formatMessageTime(msg.createdAt).replace(
                              /\s?[AP]M/i,
                              ''
                            )}
                          </div>
                        ) : (
                          <UserAvatar
                            name={senderLabel}
                            avatar={senderUser?.avatar}
                            size="md"
                            variant={isMe ? 'dark' : 'subtle'}
                            className="mt-0.5"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          {!isSameSenderAsPrev && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="text-[13px] font-semibold text-zinc-900">
                                {senderLabel}
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-end justify-between gap-3">
                            <div className="text-[14px] text-zinc-800 leading-relaxed break-words whitespace-pre-wrap">
                              {msg.content}
                            </div>

                            {isMe && (
                              <div className="shrink-0 pb-0.5">
                                {renderDeliveryStatus(msg)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-zinc-400">
                  No messages yet. Say hello below!
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Subtle Typing Indicator */}
          {typingArray.length > 0 && (
            <div className="max-w-3xl w-full mx-auto px-6 pb-1 text-xs text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
              <span>
                {typingArray.join(', ')}{' '}
                {typingArray.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}

          {/* Minimalist Single-Bar Composer */}
          <div className="px-6 pb-5 pt-2 bg-white">
            <div className="max-w-3xl mx-auto relative">
              {showEmojiPicker && (
                <div className="absolute bottom-14 left-0 bg-white border border-zinc-200 rounded-lg p-1.5 flex items-center gap-1 z-20">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setInputText((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="w-8 h-8 rounded-md hover:bg-zinc-100 flex items-center justify-center text-base transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="flex items-end gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 focus-within:bg-white focus-within:border-zinc-400 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Add emoji"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 transition-colors cursor-pointer shrink-0"
                >
                  <Smile className="w-4 h-4" />
                </button>

                <textarea
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isDirect
                      ? `Message ${partnerDisplayTitle}...`
                      : `Message #${activeGroup.name}...`
                  }
                  className="flex-1 bg-transparent text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none resize-none py-1 max-h-32 leading-relaxed"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  title="Send message"
                  className="w-8 h-8 rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
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
