import type { AppRouter } from '@reinforce/server/router';
import { TRPCClientError, type TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import { chatsView, chatView, markRead, pulseView, send, sessionView } from './views';

type Input = Record<string, unknown> | undefined;

const respond = (path: string, input: Input): unknown => {
  switch (path) {
    case 'views.session':
      return sessionView();
    case 'views.pulse':
      return pulseView();
    case 'views.chats':
      return chatsView();
    case 'views.chat':
      return chatView(String(input?.topic));
    case 'views.signals':
      return { items: [], quiet: null };
    case 'views.catalog':
      return [];
    case 'conversation.send':
      return send(String(input?.topic), String(input?.text), String(input?.requestId));
    case 'conversation.read':
      markRead(String(input?.id));
      return { ok: true };
    case 'account.visit':
      return { ok: true };
    default:
      throw new Error(`В прототипе нет данных для ${path}`);
  }
};

export const mockLink: TRPCLink<AppRouter> =
  () =>
  ({ op }) =>
    observable((observer) => {
      if (op.type === 'subscription') return () => undefined;
      const timer = setTimeout(() => {
        try {
          observer.next({ result: { type: 'data', data: respond(op.path, op.input as Input) } });
          observer.complete();
        } catch (error) {
          observer.error(TRPCClientError.from(error instanceof Error ? error : new Error(String(error))));
        }
      }, 120);
      return () => clearTimeout(timer);
    });
