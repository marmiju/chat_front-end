import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import {
  getServerSession,
  fetchServerGroup,
  fetchServerMessages,
} from '@/lib/api-server';
import ChannelChatView from '@/modules/chat/channel-chat-view';

interface ChannelPageProps {
  params: Promise<{
    channelId: string;
  }>;
}

async function ChannelDetailContent({ params }: ChannelPageProps) {
  const { channelId } = await params;

  const [{ user }, channel, messages] = await Promise.all([
    getServerSession(),
    fetchServerGroup(channelId),
    fetchServerMessages(channelId),
  ]);

  if (!channel) {
    redirect('/channels');
  }

  const chronologicalMessages = [...messages].reverse();

  return (
    <ChannelChatView
      channel={channel}
      initialMessages={chronologicalMessages}
      currentUser={user}
    />
  );
}

export default function ChannelDetailPage({ params }: ChannelPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col bg-white h-screen">
          <div className="h-14 border-b border-zinc-100 px-5 flex items-center">
            <div className="h-4 w-32 bg-zinc-100 rounded animate-pulse" />
          </div>
          <div className="flex-1" />
        </div>
      }
    >
      <ChannelDetailContent params={params} />
    </Suspense>
  );
}

