import { createFileRoute } from '@tanstack/react-router';
import { ThreadRedirect } from '~/contexts/conversation/ui/thread-redirect';

export const Route = createFileRoute('/t/$id')({ component: ThreadRoute });

function ThreadRoute() {
  const { id } = Route.useParams();
  return <ThreadRedirect id={id} />;
}
