import { createFileRoute } from '@tanstack/react-router';
import { WealthPortfolioPage } from '~/contexts/agents/ui/wealth-portfolio-page';

export const Route = createFileRoute('/portfolio')({ component: WealthPortfolioPage });
