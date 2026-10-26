import { createFileRoute } from '@tanstack/react-router';
import { RewardsPage } from '~/contexts/agents/ui/rewards-page';

export const Route = createFileRoute('/rewards')({ component: RewardsPage });
