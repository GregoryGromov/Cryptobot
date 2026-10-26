import { createFileRoute } from '@tanstack/react-router';
import * as z from 'zod/mini';
import { ConversationPage } from '~/contexts/conversation/ui/conversation-page';

const search = z.object({ idea: z.optional(z.string()) });

export const Route = createFileRoute('/m/$market')({ validateSearch: search, component: MarketRoute });

function MarketRoute() {
  const { market } = Route.useParams();
  const { idea } = Route.useSearch();
  return <ConversationPage key={market} topic={market} idea={idea ?? null} />;
}
