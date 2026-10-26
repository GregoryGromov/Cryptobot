import { Button } from '@reinforce/ui-react/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@reinforce/ui-react/dropdown-menu';
import { Check, ChevronDown, Unplug, Zap } from 'lucide-react';
import { useSession } from '~/shared/api/session';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { useModelChoice } from '../api/use-model-choice';
import { useSignIn } from './sign-in';

function Row({
  title,
  tag,
  note,
  chosen,
}: {
  readonly title: string;
  readonly tag: string | null;
  readonly note: string;
  readonly chosen: boolean;
}) {
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline gap-1.5 font-medium text-foreground">
          {title}
          {tag && <span className="font-normal text-muted-foreground text-xs">{tag}</span>}
        </span>
        <span className="text-muted-foreground text-xs leading-snug">{note}</span>
      </span>
      {chosen && <Check aria-hidden strokeWidth={2} className="size-4 shrink-0 text-foreground" />}
    </>
  );
}

export function ModelPicker() {
  const { t } = useT('account');
  const fmt = useFormatters();
  const session = useSession().data;
  const signIn = useSignIn();
  const model = useModelChoice();
  if (!session) return null;
  const { ai, auth } = session;
  const own = ai.route === 'own';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title={t('model.who')}
          disabled={model.busy}
          className="text-muted-foreground"
        >
          <Zap aria-hidden />
          {own ? t('model.mine') : 'Grok'}
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-80">
        <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
          {t('model.who')}
        </DropdownMenuLabel>
        <DropdownMenuItem
          aria-current={!own || undefined}
          className="items-start"
          onSelect={() => {
            if (own) model.choose('free');
          }}
        >
          <Row
            title={t('model.reinforce')}
            tag={t('model.free')}
            note={
              ai.free.left > 0
                ? t('model.left', { left: ai.free.left, limit: ai.free.limit })
                : t('model.over', { time: fmt.clock(ai.free.resetAt) })
            }
            chosen={!own}
          />
        </DropdownMenuItem>
        {ai.own ? (
          <DropdownMenuItem
            aria-current={own || undefined}
            className="items-start"
            onSelect={() => {
              if (!own) model.choose('own');
            }}
          >
            <Row title={t('model.mine')} tag={null} note={t('model.ownNote')} chosen={own} />
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="items-start"
            disabled={!auth.ownModelAvailable}
            onSelect={signIn.start}
          >
            <Row
              title={t('model.mine')}
              tag={auth.ownModelAvailable ? t('model.connect') : t('model.later')}
              note={auth.ownModelAvailable ? t('model.connectNote') : t('model.laterNote')}
              chosen={false}
            />
          </DropdownMenuItem>
        )}
        {ai.own && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={model.disconnect}>
              <Unplug strokeWidth={1.75} />
              {t('model.disconnect')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
