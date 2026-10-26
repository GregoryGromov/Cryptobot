import { GENERAL_TOPIC, talkTopic } from '~/shared/routing/topics';

const CONVERSATION = /^\/(c|m|t)(\/|$)/;

export const isConversationPath = (pathname: string): boolean => CONVERSATION.test(pathname);

const SECTIONS = ['chats', 'signals', 'markets', 'portfolio', 'rwa', 'journal', 'contacts', 'rewards', 'settings'] as const;

type Section = (typeof SECTIONS)[number];

export type ShellRoute =
  | { readonly kind: 'home' }
  | { readonly kind: 'section'; readonly section: Section }
  | { readonly kind: 'topic'; readonly topic: string }
  | { readonly kind: 'other' };

const decoded = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const sectionOf = (segment: string): Section | undefined => SECTIONS.find((section) => section === segment);

export const shellRouteOf = (pathname: string): ShellRoute => {
  const [first = '', second, ...rest] = pathname.split('/').filter(Boolean);
  if (first === '') return { kind: 'home' };
  if (rest.length > 0) return { kind: 'other' };
  if (first === 'settings' && second === 'instructions') return { kind: 'section', section: 'settings' };
  if (first === 'c' && second === undefined) return { kind: 'topic', topic: GENERAL_TOPIC };
  if (first === 'c' && second !== undefined) return { kind: 'topic', topic: talkTopic(decoded(second)) };
  if (first === 'm' && second !== undefined) return { kind: 'topic', topic: decoded(second) };
  const section = sectionOf(first);
  if (section !== undefined && second === undefined) return { kind: 'section', section };
  return { kind: 'other' };
};

export const activeTopicOf = (route: ShellRoute): string | null =>
  route.kind === 'topic' ? route.topic : null;
