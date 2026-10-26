import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '~/contexts/settings/ui/settings-page';

export const Route = createFileRoute('/settings')({ component: SettingsPage });
