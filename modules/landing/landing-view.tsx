'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@/modules/core/config';
import { getClientToken, getClientUser } from '@/modules/core/storage';
import {
  Hash,
  ArrowRight,
  CheckCheck,
  Terminal,
  Layers,
  Users,
  Radio,
  Send,
  Search,
  Activity,
  Lock,
  Database,
  Cpu,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

const HERO_LINES = [
  { text: 'Precision real-time team', highlight: false },
  { text: 'communication, engineered', highlight: true },
  { text: 'for instant velocity.', highlight: false },
];

const ARCH_FLOWS = [
  {
    id: 'dm',
    label: '1:1 Direct Message Flow',
    clientModule: 'modules/groups + modules/chat',
    clientAction: 'POST /api/groups/dm/:userId → emit("send_message")',
    requestPacket: 'JWT Bearer + { groupId, content }',
    responsePacket: 'io.to(room).emit("new_message")',
    backendService: 'startDirectMessageService + sendMessageService',
    dbOperation: 'Group(isDirect: true) + Message.create()',
    steps: [
      '1. Client invokes startDirectMessage(targetUserId) or sends 1:1 payload',
      '2. Express AuthMiddleware verifies Bearer JWT & Socket.IO room binding',
      '3. GroupService binds both user_{id} sockets into shared DM room',
      '4. ChatService persists message & broadcasts new_message in <15ms',
    ],
  },
  {
    id: 'channel',
    label: 'Channel Broadcast Flow',
    clientModule: 'modules/workspace + modules/chat',
    clientAction: 'emit("join_group_room") + POST /api/chats',
    requestPacket: 'POST /api/chats { group_id, content }',
    responsePacket: 'io.to(groupId).emit("new_message")',
    backendService: 'chat.controller → sendMessageService',
    dbOperation: 'Message.create({ deliveries: initialStatuses })',
    steps: [
      '1. Member composes message in #channel & dispatches typing event',
      '2. REST / Socket handler validates membership via isMemberOfGroup()',
      '3. PresenceService builds initial sent/delivered array for online peers',
      '4. Socket.IO broadcasts populated message to all active room sockets',
    ],
  },
  {
    id: 'receipts',
    label: 'Read Receipt & Presence Sync',
    clientModule: 'modules/chat + modules/workspace',
    clientAction: 'socket.emit("mark_as_read", { groupId, unreadIds })',
    requestPacket: 'WS Event: mark_as_read + active_group',
    responsePacket: 'io.to(room).emit("updateMessage", messages)',
    backendService: 'markMessagesAsReadService + presence.service',
    dbOperation: 'Message.updateMany({ "deliveries.$.status": "read" })',
    steps: [
      '1. Recipient opens channel or 1:1 DM → emits active_group & mark_as_read',
      '2. Socket handler invokes markMessagesAsReadRepo in MongoDB',
      '3. Delivery status transitions from sent → delivered → read',
      '4. Sender UI automatically updates double-check ticks to blue read state',
    ],
  },
];

const PREVIEW_CHANNELS = [
  {
    id: 'engineering',
    name: 'engineering-core',
    isDirect: false,
    topic: 'Distributed Socket.IO state & Express v5 API architecture',
    members: 14,
    messages: [
      {
        id: 'm1',
        user: 'arjun_dev',
        role: 'Lead Architect',
        time: '10:41 AM',
        text: 'Connected the Next.js frontend with the Express + Socket.IO backend using domain-isolated modules (`auth`, `groups`, `chat`, `core`).',
        status: 'read',
      },
      {
        id: 'm2',
        user: 'sara_lin',
        role: 'Systems Engineer',
        time: '10:42 AM',
        text: 'Verified `syncUserGroupsOnConnectService` — online member presence and unread delivery states sync in under 15ms on handshake.',
        status: 'read',
      },
      {
        id: 'm3',
        user: 'mar_miju',
        role: 'Admin',
        time: '10:44 AM',
        text: 'Both group channels and 1-to-1 person-to-person direct messages run on the unified real-time Socket.IO room engine.',
        status: 'read',
      },
    ],
  },
  {
    id: 'dm-sara',
    name: 'sara_lin',
    isDirect: true,
    topic: '1-to-1 Direct Message • Online',
    members: 2,
    messages: [
      {
        id: 'dm1',
        user: 'sara_lin',
        role: 'Direct Message',
        time: '11:04 AM',
        text: 'Hey! Can we test the new 1-to-1 person-to-person direct messaging flow?',
        status: 'read',
      },
      {
        id: 'dm2',
        user: 'mar_miju',
        role: 'You',
        time: '11:05 AM',
        text: 'Yes! Click any teammate in the sidebar or use the + button under Direct Messages to chat 1-on-1 immediately.',
        status: 'read',
      },
    ],
  },
  {
    id: 'releases',
    name: 'release-pipeline',
    isDirect: false,
    topic: 'Production readiness & real-time telemetry',
    members: 22,
    messages: [
      {
        id: 'r1',
        user: 'ci_bot',
        role: 'Automation',
        time: '11:10 AM',
        text: '[DEPLOY-OK] Backend `/health` responded 200 OK. WebSocket rooms bound to `user_{id}` and `group_{id}`.',
        status: 'read',
      },
    ],
  },
];

export default function LandingView() {
  const [revealKey, setRevealKey] = useState(0);
  const [activeFlowIndex, setActiveFlowIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeTabId, setActiveTabId] = useState('engineering');
  const [previewInput, setPreviewInput] = useState('');
  const [customMessages, setCustomMessages] = useState<
    Record<
      string,
      Array<{
        id: string;
        user: string;
        role: string;
        time: string;
        text: string;
        status: string;
      }>
    >
  >({});
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<{ username: string } | null>(
    null
  );

  useEffect(() => {
    const token = getClientToken();
    const user = getClientUser();
    if (token && user) {
      setLoggedInUser(user);
    }

    fetch(`${APP_CONFIG.BACKEND_URL}/health`)
      .then((r) => setBackendOnline(r.ok))
      .catch(() => setBackendOnline(false));
  }, []);

  // Automatically cycle active step in the Architecture Diagram
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, [activeFlowIndex]);

  const activeFlow = ARCH_FLOWS[activeFlowIndex];

  const currentChannel =
    PREVIEW_CHANNELS.find((c) => c.id === activeTabId) || PREVIEW_CHANNELS[0];
  const allChannelMessages = [
    ...currentChannel.messages,
    ...(customMessages[currentChannel.id] || []),
  ];

  const handlePreviewSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewInput.trim()) return;
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newMsg = {
      id: `local-${Date.now()}`,
      user: loggedInUser?.username || 'you_guest',
      role: 'Live Preview',
      time: now,
      text: previewInput.trim(),
      status: 'read',
    };
    setCustomMessages((prev) => ({
      ...prev,
      [currentChannel.id]: [...(prev[currentChannel.id] || []), newMsg],
    }));
    setPreviewInput('');
  };

  // Running character index for staggered char-by-char reveal
  let globalCharCounter = 0;

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col selection:bg-zinc-900 selection:text-white">
      {/* Top Architectural Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-[6px] bg-zinc-950 text-white flex items-center justify-center font-mono text-xs font-bold tracking-tighter border border-zinc-950 transition-transform duration-200 group-hover:scale-105">
                NP
              </div>
              <div className="flex items-center gap-2">
                <span className="font-google-sans text-base font-bold tracking-tight text-zinc-950">
                  NexusPulse
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] bg-zinc-100 text-zinc-600 border border-zinc-200">
                  v2.5 Light
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600">
              <a
                href="#architecture-diagram"
                className="hover:text-zinc-950 transition-colors"
              >
                Live Architecture
              </a>
              <a
                href="#preview"
                className="hover:text-zinc-950 transition-colors"
              >
                Interactive Sandbox
              </a>
              <a
                href="#modules"
                className="hover:text-zinc-950 transition-colors"
              >
                System Modules
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Backend Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-zinc-50 border border-zinc-200 text-[11px] font-mono text-zinc-600">
              <span
                className={`w-2 h-2 rounded-[2px] ${
                  backendOnline === null
                    ? 'bg-amber-500 animate-pulse'
                    : backendOnline
                    ? 'bg-emerald-600 animate-pulse'
                    : 'bg-zinc-400'
                }`}
              />
              <span>
                {backendOnline === null
                  ? 'API: CHECKING'
                  : backendOnline
                  ? 'API & SOCKET: ONLINE'
                  : 'API: STANDBY'}
              </span>
            </div>

            {loggedInUser ? (
              <Link
                href="/channels"
                className="group relative overflow-hidden px-3.5 py-2 rounded-[6px] text-xs font-semibold bg-zinc-950 text-white border border-zinc-950 transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
              >
                <span className="relative z-10">
                  Workspace (@{loggedInUser.username})
                </span>
                <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-[6px] text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200 transition-all duration-150 active:scale-[0.98]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="group relative overflow-hidden px-3.5 py-2 rounded-[6px] text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 border border-zinc-950 transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
                >
                  <span>Start Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section with Character-by-Character Automatic Title Reveal */}
        <section className="border-b border-zinc-200 bg-[#fafafa] relative overflow-hidden">
          {/* Subtle architectural 1px grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-45"
            style={{
              backgroundImage:
                'linear-gradient(to right, #e4e4e7 1px, transparent 1px), linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="max-w-4xl">
              {/* Top Technical Badge + Replay Animation Trigger */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-white border border-zinc-200 text-zinc-800">
                  <span className="w-2 h-2 rounded-[2px] bg-blue-600 animate-ping" />
                  <span className="font-mono text-xs tracking-tight">
                    GROUP CHANNELS + 1:1 DIRECT MESSAGING • SOCKET.IO ENGINE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRevealKey((prev) => prev + 1)}
                  title="Replay Character Reveal"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-white hover:bg-zinc-100 border border-zinc-200 text-[11px] font-mono text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replay Reveal</span>
                </button>
              </div>

              {/* Automatic Character-by-Character Reveal Heading */}
              <h1
                key={revealKey}
                aria-label="Precision real-time team communication, engineered for instant velocity."
                className="font-google-sans text-4xl sm:text-6xl lg:text-[64px] font-bold tracking-tight text-zinc-950 leading-[1.08] mb-6"
              >
                {HERO_LINES.map((line, lineIdx) => {
                  const words = line.text.split(' ');
                  return (
                    <span key={lineIdx} className="block">
                      {words.map((word, wordIdx) => (
                        <span
                          key={wordIdx}
                          className={`inline-block whitespace-nowrap mr-[0.26em] ${
                            line.highlight
                              ? 'text-blue-600 underline decoration-zinc-300 decoration-1 underline-offset-8'
                              : 'text-zinc-950'
                          }`}
                        >
                          {Array.from(word).map((char, charIdx) => {
                            const delayMs = globalCharCounter * 22;
                            globalCharCounter += 1;
                            return (
                              <span
                                key={charIdx}
                                className="animate-char-reveal"
                                style={{ animationDelay: `${delayMs}ms` }}
                              >
                                {char}
                              </span>
                            );
                          })}
                        </span>
                      ))}
                    </span>
                  );
                })}
              </h1>

              <p
                className="text-base sm:text-lg text-zinc-600 leading-relaxed mb-9 max-w-2xl bg-[#fafafa]/90 p-1 rounded-[4px] animate-fade-slide-up"
                style={{ animationDelay: '750ms' }}
              >
                A modular Next.js 16 and Express 5 workspace supporting both
                team channels and private 1-to-1 person-to-person messaging,
                complete with real-time read receipts and live presence sync.
              </p>

              {/* Animated CTA Buttons */}
              <div
                className="flex flex-wrap items-center gap-3 animate-fade-slide-up"
                style={{ animationDelay: '920ms' }}
              >
                {/* Primary Button with Sliding Fill & Arrow Animation */}
                <Link
                  href="/channels"
                  className="group relative overflow-hidden px-6 py-3 rounded-[6px] text-sm font-semibold bg-zinc-950 text-white border border-zinc-950 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] inline-flex items-center gap-2.5"
                >
                  <span className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">Launch Live Workspace</span>
                  <span className="relative z-10 w-5 h-5 rounded-[4px] bg-white/15 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                {/* Secondary Button with Horizontal Sweep Animation */}
                <Link
                  href="/register"
                  className="group relative overflow-hidden px-5 py-3 rounded-[6px] text-sm font-semibold bg-white text-zinc-900 border border-zinc-300 hover:border-zinc-950 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] inline-flex items-center gap-2"
                >
                  <span className="absolute inset-0 bg-zinc-100 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">Create Team Account</span>
                  <ArrowRight className="w-3.5 h-3.5 relative z-10 text-zinc-400 group-hover:text-zinc-950 transition-all duration-200 group-hover:translate-x-0.5" />
                </Link>

                {/* Tertiary Quick Demo Button */}
                <Link
                  href="/login"
                  className="group px-4 py-3 rounded-[6px] text-xs font-mono text-zinc-700 hover:text-zinc-950 bg-white border border-zinc-200 hover:border-zinc-400 transition-all duration-150 inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-[2px] bg-emerald-600 group-hover:scale-125 transition-transform" />
                  <span>Instant Demo Login →</span>
                </Link>
              </div>
            </div>

            {/* Technical Metrics Strip */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 border border-zinc-200 rounded-[8px] bg-white divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
              <div className="p-4">
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Messaging Modes
                </div>
                <div className="mt-1 text-lg font-bold text-zinc-950">
                  Channels + 1:1 DMs
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Group rooms & person-to-person
                </div>
              </div>
              <div className="p-4">
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Transport Layer
                </div>
                <div className="mt-1 text-lg font-bold text-zinc-950">
                  WebSocket + REST
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Bi-directional event acks
                </div>
              </div>
              <div className="p-4">
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Read Receipts
                </div>
                <div className="mt-1 text-lg font-bold text-zinc-950">
                  3-State Tracking
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Sent → Delivered → Read
                </div>
              </div>
              <div className="p-4">
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Design System
                </div>
                <div className="mt-1 text-lg font-bold text-zinc-950">
                  Pure Light Grid
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  1px borders • 2–8px radius
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animated Interactive Architecture Diagram Section */}
        <section
          id="architecture-diagram"
          className="py-16 sm:py-20 border-b border-zinc-200 bg-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-blue-600 mb-1">
                  <span className="w-2 h-2 rounded-[2px] bg-blue-600 animate-ping" />
                  <span>LIVE SYSTEM ARCHITECTURE TELEMETRY</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
                  Real-Time Modular Architecture Diagram
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                  Watch live data packets flow between Next.js Frontend Modules,
                  the Socket.IO / REST Transport Bus, and Express Backend
                  Services.
                </p>
              </div>

              {/* Interactive Flow Scenario Selector Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {ARCH_FLOWS.map((flow, idx) => {
                  const isSelected = idx === activeFlowIndex;
                  return (
                    <button
                      key={flow.id}
                      type="button"
                      onClick={() => {
                        setActiveFlowIndex(idx);
                        setActiveStepIndex(0);
                      }}
                      className={`px-3 py-2 rounded-[6px] text-xs font-mono transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-[#fafafa] text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:text-zinc-950'
                      }`}
                    >
                      {flow.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Animated Architecture Canvas */}
            <div className="border border-zinc-200 rounded-[8px] bg-[#fafafa] p-5 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Column 1: Frontend Next.js Modular Layer */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between px-3 py-2 rounded-[6px] bg-white border border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-900" />
                      <span className="text-xs font-bold text-zinc-950">
                        Next.js 16 Frontend
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-zinc-100 text-zinc-600 border border-zinc-200">
                      CLIENT + SSR
                    </span>
                  </div>

                  {[
                    {
                      name: 'modules/core',
                      desc: 'http-client.ts • socket-client.ts',
                      active: activeStepIndex === 0 || activeStepIndex === 1,
                    },
                    {
                      name: 'modules/groups',
                      desc: 'Channels + 1:1 Direct Message service',
                      active:
                        activeFlow.id === 'dm' || activeFlow.id === 'channel',
                    },
                    {
                      name: 'modules/chat',
                      desc: 'Messages, typing & 3-state read receipts',
                      active: true,
                    },
                    {
                      name: 'modules/workspace',
                      desc: 'Live online presence & room sync context',
                      active: activeStepIndex === 3,
                    },
                  ].map((mod) => (
                    <div
                      key={mod.name}
                      className={`p-3 rounded-[6px] border transition-all duration-300 ${
                        mod.active
                          ? 'bg-white border-zinc-900'
                          : 'bg-white/70 border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-zinc-950">
                          {mod.name}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-[2px] ${
                            mod.active
                              ? 'bg-blue-600 animate-pulse'
                              : 'bg-zinc-300'
                          }`}
                        />
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        {mod.desc}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 2: Animated Bi-Directional Transport Bus */}
                <div className="lg:col-span-4 flex flex-col justify-center space-y-5 py-4">
                  {/* Outbound Request / Socket Emit Stream */}
                  <div className="p-3.5 rounded-[6px] bg-white border border-zinc-200 relative overflow-hidden">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2">
                      <span>OUTBOUND DISPATCH</span>
                      <span className="text-blue-600 font-bold">→</span>
                    </div>

                    {/* Animated SVG Line */}
                    <svg className="w-full h-5" viewBox="0 0 260 20">
                      <line
                        x1="0"
                        y1="10"
                        x2="260"
                        y2="10"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        className="animate-flow-dash"
                      />
                    </svg>

                    {/* Traveling Packet Pill */}
                    <div className="relative h-6 overflow-hidden mt-1">
                      <div className="animate-packet-right inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-zinc-950 text-white text-[10px] font-mono whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-[2px] bg-blue-400" />
                        <span>{activeFlow.requestPacket}</span>
                      </div>
                    </div>
                  </div>

                  {/* Central Protocol Hub Node */}
                  <div className="p-3.5 rounded-[6px] bg-zinc-950 text-white border border-zinc-950 text-center">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      ACTIVE PROTOCOL PIPELINE
                    </div>
                    <div className="text-xs font-mono font-bold text-white mt-1 truncate">
                      {activeFlow.clientAction}
                    </div>
                  </div>

                  {/* Inbound Real-Time Broadcast Stream */}
                  <div className="p-3.5 rounded-[6px] bg-white border border-zinc-200 relative overflow-hidden">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2">
                      <span className="text-emerald-600 font-bold">←</span>
                      <span>REAL-TIME ROOM BROADCAST</span>
                    </div>

                    <svg className="w-full h-5" viewBox="0 0 260 20">
                      <line
                        x1="0"
                        y1="10"
                        x2="260"
                        y2="10"
                        stroke="#059669"
                        strokeWidth="1.5"
                        className="animate-flow-dash-reverse"
                      />
                    </svg>

                    <div className="relative h-6 overflow-hidden mt-1">
                      <div className="animate-packet-left inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-[2px] bg-emerald-600" />
                        <span>{activeFlow.responsePacket}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Express 5 + Socket.IO + MongoDB Backend */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between px-3 py-2 rounded-[6px] bg-white border border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-zinc-900" />
                      <span className="text-xs font-bold text-zinc-950">
                        Express 5 + Socket.IO 4
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PORT 5000
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-[6px] border transition-all duration-300 ${
                      activeStepIndex === 1
                        ? 'bg-white border-zinc-900'
                        : 'bg-white/70 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-zinc-950">
                        middlewares/Auth + Zod
                      </span>
                      <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      JWT verification & request schema validation
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-[6px] border transition-all duration-300 ${
                      activeStepIndex === 2
                        ? 'bg-white border-zinc-900'
                        : 'bg-white/70 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-zinc-950">
                        {activeFlow.backendService}
                      </span>
                      <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      Room binding (`user_id` & `group_id`) + Socket emit
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-[6px] border transition-all duration-300 ${
                      activeStepIndex === 3
                        ? 'bg-white border-zinc-900'
                        : 'bg-white/70 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-zinc-950">
                        MongoDB Repositories
                      </span>
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-[11px] font-mono text-zinc-600 mt-1 truncate">
                      {activeFlow.dbOperation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Step-by-Step Execution Ticker */}
              <div className="mt-6 pt-5 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {activeFlow.steps.map((stepText, idx) => {
                  const isCurrentStep = idx === activeStepIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`p-3 rounded-[6px] border text-xs font-mono transition-all cursor-pointer ${
                        isCurrentStep
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-[2px] ${
                            isCurrentStep
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          STEP 0{idx + 1}
                        </span>
                        {isCurrentStep && (
                          <span className="w-2 h-2 rounded-[2px] bg-emerald-400 animate-ping" />
                        )}
                      </div>
                      <div className="leading-relaxed text-[11px] mt-1">
                        {stepText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Live Workspace Sandbox (Channels + 1:1 Direct Messages) */}
        <section
          id="preview"
          className="py-16 sm:py-20 border-b border-zinc-200 bg-[#fafafa]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-blue-600 mb-1">
                  INTERACTIVE WORKSPACE SANDBOX
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
                  Test group channels and 1-to-1 direct messages right here.
                </h2>
              </div>
              <Link
                href="/channels"
                className="group text-xs font-semibold text-zinc-900 hover:text-zinc-950 inline-flex items-center gap-1.5 border border-zinc-200 hover:border-zinc-900 px-3.5 py-2 rounded-[6px] bg-white transition-all"
              >
                <span>Open Full Screen Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="border border-zinc-200 rounded-[8px] bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
              {/* Left Sidebar Preview */}
              <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-[#fafafa] flex flex-col justify-between">
                <div>
                  <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between bg-white">
                    <span className="font-bold text-xs tracking-tight text-zinc-950">
                      NexusPulse Engineering
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      LIVE
                    </span>
                  </div>

                  <div className="p-3">
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-400 mb-3">
                      <span className="flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        <span>Jump to channel or DM...</span>
                      </span>
                      <kbd className="text-[10px] font-mono px-1 py-0.5 rounded-[2px] bg-zinc-100 text-zinc-600 border border-zinc-200">
                        ⌘K
                      </kbd>
                    </div>

                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2 py-1">
                      Channels & 1:1 DMs
                    </div>
                    <div className="space-y-1 mt-1">
                      {PREVIEW_CHANNELS.map((ch) => {
                        const active = ch.id === currentChannel.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setActiveTabId(ch.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] text-xs font-medium transition-colors cursor-pointer text-left ${
                              active
                                ? 'bg-zinc-950 text-white'
                                : 'text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              {ch.isDirect ? (
                                <MessageSquare
                                  className={`w-3.5 h-3.5 ${
                                    active ? 'text-zinc-300' : 'text-zinc-400'
                                  }`}
                                />
                              ) : (
                                <Hash
                                  className={`w-3.5 h-3.5 ${
                                    active ? 'text-zinc-300' : 'text-zinc-400'
                                  }`}
                                />
                              )}
                              <span className="truncate">
                                {ch.isDirect ? `@${ch.name}` : ch.name}
                              </span>
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] ${
                                active
                                  ? 'bg-zinc-800 text-zinc-200'
                                  : 'bg-zinc-200/70 text-zinc-600'
                              }`}
                            >
                              {ch.isDirect ? '1:1' : ch.members}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-zinc-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[6px] bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
                      {loggedInUser?.username
                        ? loggedInUser.username[0].toUpperCase()
                        : 'G'}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-900">
                        @{loggedInUser?.username || 'guest_preview'}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-mono">
                        ● Socket Ready
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Chat Feed Preview */}
              <div className="lg:col-span-9 flex flex-col justify-between bg-white">
                <div className="h-12 px-5 border-b border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate">
                    {currentChannel.isDirect ? (
                      <MessageSquare className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <Hash className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className="font-bold text-sm text-zinc-950">
                      {currentChannel.isDirect
                        ? `@${currentChannel.name}`
                        : currentChannel.name}
                    </span>
                    <span className="text-xs text-zinc-500 border-l border-zinc-200 pl-2.5 truncate hidden sm:inline">
                      {currentChannel.topic}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-600 px-2 py-1 rounded-[4px] bg-zinc-50 border border-zinc-200">
                      {currentChannel.isDirect
                        ? 'Direct Message'
                        : `${currentChannel.members} members`}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3 overflow-y-auto max-h-80">
                  {allChannelMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start gap-3 p-2.5 rounded-[6px] hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-[6px] bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center text-xs font-bold shrink-0">
                        {msg.user[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-zinc-950">
                            @{msg.user}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-zinc-100 text-zinc-600 border border-zinc-200">
                            {msg.role}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {msg.time}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                      <div className="shrink-0 pt-1">
                        <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-zinc-200 bg-[#fafafa]">
                  <form
                    onSubmit={handlePreviewSend}
                    className="flex items-center gap-2 bg-white border border-zinc-200 rounded-[6px] p-1.5 focus-within:border-zinc-900 transition-colors"
                  >
                    <input
                      type="text"
                      value={previewInput}
                      onChange={(e) => setPreviewInput(e.target.value)}
                      placeholder={
                        currentChannel.isDirect
                          ? `Try messaging @${currentChannel.name}...`
                          : `Try typing a message in #${currentChannel.name}...`
                      }
                      className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none bg-transparent"
                    />
                    <button
                      type="submit"
                      className="group px-3.5 py-1.5 rounded-[4px] bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Send</span>
                      <Send className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modular Architecture Grid */}
        <section
          id="modules"
          className="py-16 sm:py-24 border-b border-zinc-200 bg-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">
                END-TO-END MODULAR INTEGRATION
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-zinc-950 tracking-tight">
                Clean separation between transport, domain services, and UI.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-zinc-600">
                Every frontend module maps 1:1 to your Express controllers,
                repositories, and Socket.IO event handlers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-zinc-200 rounded-[8px] bg-white divide-y md:divide-y-0 md:divide-x divide-zinc-200">
              <div className="p-6 border-b border-zinc-200">
                <div className="w-9 h-9 rounded-[6px] bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="font-mono text-[11px] text-zinc-500 mb-1">
                  modules/core
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-2">
                  Unified HTTP & Socket Transport
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Centralized Bearer JWT injection, SSR cookie synchronization,
                  and singleton Socket.IO connection management with automatic
                  reconnection.
                </p>
              </div>

              <div className="p-6 border-b border-zinc-200">
                <div className="w-9 h-9 rounded-[6px] bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                  <Radio className="w-4 h-4" />
                </div>
                <div className="font-mono text-[11px] text-zinc-500 mb-1">
                  modules/chat
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-2">
                  Real-Time Message & Receipt Engine
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Subscribes to `new_message`, `updateMessage`, and `typing`
                  events. Automatically dispatches `mark_as_read` when viewing
                  active channels or DMs.
                </p>
              </div>

              <div className="p-6 border-b border-zinc-200">
                <div className="w-9 h-9 rounded-[6px] bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                  <Users className="w-4 h-4" />
                </div>
                <div className="font-mono text-[11px] text-zinc-500 mb-1">
                  modules/groups
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-2">
                  Channels & 1-to-1 Direct Messages
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Create channels, start 1-to-1 person-to-person DMs
                  (`POST /api/groups/dm/:targetUserId`), invite teammates, and
                  sync membership changes instantaneously.
                </p>
              </div>

              <div className="p-6">
                <div className="w-9 h-9 rounded-[6px] bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="font-mono text-[11px] text-zinc-500 mb-1">
                  modules/workspace
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-2">
                  Live Presence & Room Sync
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Tracks `initialonline`, `online_member`, and `user_offline`
                  across all joined groups and direct conversations in real
                  time.
                </p>
              </div>

              <div className="p-6">
                <div className="w-9 h-9 rounded-[6px] bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="font-mono text-[11px] text-zinc-500 mb-1">
                  modules/auth
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-2">
                  JWT + Zod Validated Auth
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Connects directly to `/api/user/login`, `/api/user/register`,
                  and `/api/user/search` with instant demo credential autofill
                  for testing.
                </p>
              </div>

              <div className="p-6">
                <div className="w-9 h-9 rounded-[6px] bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="font-mono text-[11px] text-zinc-500 mb-1">
                  Strict UI Specification
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-2">
                  Zero Shadow, 2–8px Geometric Radii
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Crafted with 1px hairline borders, crisp light-mode surfaces,
                  and strict 2px, 4px, 6px, and 8px corner radii with zero
                  visual clutter.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-[#fafafa] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900">NexusPulse</span>
            <span>— Modular Real-Time Channels & 1:1 Direct Messaging</span>
          </div>
          <div className="font-mono text-[11px]">
            Next.js 16 • Express 5 • Socket.IO 4 • Light Architectural UI
          </div>
        </div>
      </footer>
    </div>
  );
}
