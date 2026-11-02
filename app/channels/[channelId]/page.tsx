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

export default async function ChannelDetailPage({ params }: ChannelPageProps) {
  const { channelId } = await params;
  const { user } = await getServerSession();

  const [channel, messages] = await Promise.all([
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
