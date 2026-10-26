import { Button } from '@reinforce/ui-react/button';
import { InlineNote } from '@reinforce/ui-react/inline-note';
import { useSignIn } from '~/contexts/account/ui/sign-in';
import { useSession } from '~/shared/api/session';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';

export function LimitNote({ needsLogin }: { readonly needsLogin: boolean }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const signIn = useSignIn();
  const session = useSession().data;
  if (!session) return null;
  const spent = session.ai.free.left === 0;
  if (!spent && !needsLogin) return null;
  const offersSignIn = session.user.guest && session.auth.xaiAvailable;
  return (
    <InlineNote
      tone="neutral"
      title={needsLogin ? t('limit.needsLogin') : t('limit.spent')}
      className="motion-safe:fade-in motion-safe:slide-in-from-bottom-1 mb-2 motion-safe:animate-in motion-safe:duration-300"
    >
      <span className="flex flex-col items-start gap-2">
        <span>
          {needsLogin
            ? t('limit.needsLoginText')
            : [
                t('limit.back', { time: f.clock(session.ai.free.resetAt) }),
                offersSignIn ? t('limit.guest') : null,
              ]
                .filter((sentence) => sentence !== null)
                .join(' ')}
        </span>
        {offersSignIn && (
          <Button variant="secondary" size="sm" onClick={signIn.start}>
            {t('limit.signIn')}
          </Button>
        )}
      </span>
    </InlineNote>
  );
}
