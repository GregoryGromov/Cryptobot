import { createFileRoute } from '@tanstack/react-router';
import { ConversationPage } from '~/contexts/conversation/ui/conversation-page';
import { GENERAL_TOPIC } from '~/shared/routing/topics';

export const Route = createFileRoute('/c/')({ component: () => <ConversationPage topic={GENERAL_TOPIC} /> });
