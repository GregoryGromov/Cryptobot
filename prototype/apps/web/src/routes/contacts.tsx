import { createFileRoute } from '@tanstack/react-router';
import { ContactsPage } from '~/contexts/agents/ui/contacts-page';

export const Route = createFileRoute('/contacts')({ component: ContactsPage });
