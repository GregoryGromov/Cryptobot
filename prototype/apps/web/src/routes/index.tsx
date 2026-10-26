import { createFileRoute } from '@tanstack/react-router';
import { HomeScreen } from '~/contexts/conversation/ui/home-screen';

export const Route = createFileRoute('/')({ component: HomeScreen });
