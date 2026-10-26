import { createFileRoute } from '@tanstack/react-router';
import { JournalPage } from '~/contexts/agents/ui/journal-page';

export const Route = createFileRoute('/journal')({ component: JournalPage });
