import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/broker')({
  beforeLoad: ({ location }) => {
    const tab = new URLSearchParams(location.searchStr).get('tab');
    if (tab === 'instructions') throw redirect({ to: '/settings/instructions', replace: true });
    throw redirect({ to: '/portfolio', search: { tab: 'forecasts' }, replace: true });
  },
});
