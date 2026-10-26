import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/app';
import { router } from './app/router';
import { installVisitTracking } from './app/visit-tracking';
import { installLiveInvalidation } from './shared/api/live';
import { queryClient } from './shared/api/query-client';

installLiveInvalidation(queryClient);
installVisitTracking(router);

const root = document.getElementById('root');
if (!root) throw new Error('#root container not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
