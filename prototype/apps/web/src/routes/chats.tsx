import { createFileRoute } from '@tanstack/react-router';
import { ChatsPage } from '~/contexts/conversation/ui/chats-page';

export const Route = createFileRoute('/chats')({ component: ChatsPage });
