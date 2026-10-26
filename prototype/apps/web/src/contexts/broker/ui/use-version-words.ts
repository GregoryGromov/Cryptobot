import { useSession } from '~/shared/api/session';
import { useT } from '~/shared/i18n';

export function useVersionWords(): string | null {
  const { t } = useT('broker');
  const { t: account } = useT('account');
  const session = useSession().data;
  const version = session?.version;
  if (!session || !version) return null;
  const grok = session.ai.route === 'own' ? account('model.mine') : session.connection.model;
  return t('version', { n: version.n, model: version.model === 'grok' ? grok : t('scripted') });
}
