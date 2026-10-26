import { createFileRoute } from '@tanstack/react-router';
import { SignalsPage } from '~/contexts/signals/ui/signals-page';

export const Route = createFileRoute('/signals')({ component: SignalsPage });
