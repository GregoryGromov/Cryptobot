import { createFileRoute } from '@tanstack/react-router';
import { ConversationPage } from '~/contexts/conversation/ui/conversation-page';
import { talkTopic } from '~/shared/routing/topics';

export const Route = createFileRoute('/c/$talk')({ component: TalkRoute });

function TalkRoute() {
  const { talk } = Route.useParams();
  return <ConversationPage key={talk} topic={talkTopic(talk)} />;
}
