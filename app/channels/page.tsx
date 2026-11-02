import { redirect } from 'next/navigation';
import { fetchServerGroups } from '@/lib/api-server';
import NoChannelsView from '@/modules/groups/no-channels-view';

export default async function ChannelsPage() {
  const groups = await fetchServerGroups();

  if (groups && groups.length > 0) {
    redirect(`/channels/${groups[0]._id}`);
  }

  return <NoChannelsView />;
}
