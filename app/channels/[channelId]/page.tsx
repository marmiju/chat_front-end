import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import {
  getServerSession,
  fetchServerGroup,
  fetchServerMessages,
} from '@/lib/api-server';
import ChannelChatView from '@/modules/chat/channel-chat-view';
import { ChannelChatSkeleton } from '@/modules/core/skeletons';

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
    <Suspense fallback={<ChannelChatSkeleton />}>
      <ChannelDetailContent params={params} />
    </Suspense>
  );
}

