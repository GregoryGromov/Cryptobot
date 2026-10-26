import { createFileRoute } from '@tanstack/react-router';
import * as z from 'zod/mini';
import { MarketsPage } from '~/contexts/markets/ui/markets-page';

const search = z.object({
  cls: z.catch(z.optional(z.string()), undefined),
  q: z.catch(z.optional(z.string()), undefined),
  m: z.catch(z.optional(z.string()), undefined),
});

export const Route = createFileRoute('/markets')({ validateSearch: search, component: MarketsRoute });

function MarketsRoute() {
  const navigate = Route.useNavigate();
  return (
    <MarketsPage
      search={Route.useSearch()}
      onSearch={(next) => void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true })}
    />
  );
}
