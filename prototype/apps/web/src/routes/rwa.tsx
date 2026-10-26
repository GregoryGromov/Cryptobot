import { createFileRoute } from '@tanstack/react-router';
import { RwaPage } from '~/contexts/agents/ui/rwa-page';

export const Route = createFileRoute('/rwa')({ component: RwaPage });
