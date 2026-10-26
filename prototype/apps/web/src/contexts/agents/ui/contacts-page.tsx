import { sectionCardClass } from '@reinforce/ui-primitives/card';
import { Button } from '@reinforce/ui-react/button';
import { toast } from '@reinforce/ui-react/sonner';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { Plus, Send, TriangleAlert } from 'lucide-react';
import { match } from 'ts-pattern';
import { agentOf } from '~/shared/api/mock/agents';
import { CONTACTS, type Contact, type ContactState } from '~/shared/api/mock/wallet';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { dataColumnClass } from '~/shared/ui/page-column';

const stateClass = (state: ContactState): string =>
  match(state)
    .with('verified', 'own', () => 'bg-up/12 text-up')
    .with('exchange', () => 'bg-foreground/6 text-foreground-soft')
    .with('new', () => 'bg-(--palette-amber-500)/14 text-(--palette-amber-600)')
    .exhaustive();

export function ContactsPage() {
  const { t } = useT('shell');
  return (
    <div className={dataColumnClass}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-1">
          <Heading as="h1" size="page">
            {t('agents.contacts.title')}
          </Heading>
          <Text variant="muted" className="text-row">
            {t('agents.contacts.lead')}
          </Text>
        </div>
        <Button variant="secondary" size="sm" onClick={() => toast(t('agents.soon'))}>
          <Plus aria-hidden />
          {t('agents.contacts.add')}
        </Button>
      </div>
      <section className={cn(sectionCardClass, 'pt-2 pb-2')}>
        <ul className="flex flex-col">
          {CONTACTS.map((contact) => (
            <ContactRow key={contact.address} contact={contact} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function ContactRow({ contact }: { readonly contact: Contact }) {
  const { t } = useT('shell');
  return (
    <li className="flex items-center gap-3 border-foreground/7 border-t py-3.5 first:border-t-0">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/8 font-semibold text-foreground-soft text-sm"
      >
        {contact.name.slice(0, 1)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground text-sm">{contact.name}</span>
          <span
            className={cn('rounded-full px-2 py-0.5 font-medium text-[0.6875rem]', stateClass(contact.state))}
          >
            {t(`agents.contacts.state.${contact.state}`)}
          </span>
        </span>
        <span className="text-meta text-muted-foreground">
          <span className="font-mono">{contact.address}</span> · {contact.chain} · {contact.last}
        </span>
        {contact.state === 'new' && (
          <span className="flex items-center gap-1.5 text-(--palette-amber-600) text-meta">
            <TriangleAlert strokeWidth={2} className="size-3.5 shrink-0" />
            {t('agents.contacts.newNote')}
          </span>
        )}
      </div>
      <Button asChild variant="ghost" size="sm" className="shrink-0">
        <Link {...topicLink(agentOf('trader').topic)}>
          <Send aria-hidden />
          <span className="max-sm:sr-only">{t('agents.contacts.send')}</span>
        </Link>
      </Button>
    </li>
  );
}
