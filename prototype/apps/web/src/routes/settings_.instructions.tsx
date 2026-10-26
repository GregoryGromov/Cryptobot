import { createFileRoute } from '@tanstack/react-router';
import { InstructionsPage } from '~/contexts/broker/ui/instructions-page';

export const Route = createFileRoute('/settings_/instructions')({ component: InstructionsPage });
