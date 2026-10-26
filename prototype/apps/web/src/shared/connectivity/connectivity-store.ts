import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

export type ConnectivityKind = 'online' | 'offline';

const current = (): ConnectivityKind => (onlineManager.isOnline() ? 'online' : 'offline');

export const useConnectivityKind = (): ConnectivityKind =>
  useSyncExternalStore(
    (changed) => onlineManager.subscribe(changed),
    current,
    () => 'online',
  );

export const useIsBrowserOffline = (): boolean => useConnectivityKind() === 'offline';
