import { Button } from '@reinforce/ui-react/button';
import { Textarea } from '@reinforce/ui-react/textarea';
import { cn } from '@reinforce/ui-styles/cn';
import { ArrowUp, Plus, X } from 'lucide-react';
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';
import { useMarketPicker } from '~/app/market-picker/market-picker';
import { ModelPicker } from '~/contexts/account/ui/model-picker';
import { useFlight } from '~/shared/hooks/use-arrival';
import { useT } from '~/shared/i18n';
import { assetCode } from '~/shared/routing/topics';
import { composeIntent, composerReducer, EMPTY_COMPOSER, type Intent, isComposing } from '../domain/composer';

const MAX_LENGTH = 4000;

const fitsByCss = (): boolean => typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');

const fitHeight = (field: HTMLTextAreaElement) => {
  field.style.height = 'auto';
  field.style.height = `${field.scrollHeight}px`;
};

export function Composer({
  placeholder,
  pickTitle,
  locked = false,
  above,
  attachment,
  tools,
  onSay,
}: {
  readonly placeholder: (asset: boolean) => string;
  /** The title of the market picker; no button to pick a market when null. */
  readonly pickTitle: string | null;
  readonly locked?: boolean;
  readonly above?: ReactNode;
  /** What the words will be sent with, shown before them. */
  readonly attachment?: ReactNode;
  readonly tools?: ReactNode;
  readonly onSay: (intent: Intent) => Promise<void>;
}) {
  const { t } = useT('conversation');
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const glass = useRef<HTMLDivElement>(null);
  useFlight(glass, 'composer');
  const [state, dispatch] = useReducer(composerReducer, EMPTY_COMPOSER);
  const pickMarket = useMarketPicker();
  const code = state.asset ? assetCode(state.asset.ticker) : null;
  const sending = state.inflight !== null;
  const ready = !locked && !sending && composeIntent(state, '') !== null;

  const text = state.text;
  useLayoutEffect(() => {
    const node = field.current;
    if (node && node.value === text && !fitsByCss()) fitHeight(node);
  }, [text]);

  const hasAsset = state.asset !== null;
  useEffect(() => {
    const node = field.current;
    if (!node || !hasAsset) return;
    const erase = (event: InputEvent) => {
      if (event.inputType !== 'deleteContentBackward' || node.selectionStart !== 0 || node.selectionEnd !== 0)
        return;
      event.preventDefault();
      dispatch({ type: 'unpicked' });
    };
    node.addEventListener('beforeinput', erase);
    return () => node.removeEventListener('beforeinput', erase);
  }, [hasAsset]);

  const submit = () => {
    if (locked || sending) return;
    const intent = composeIntent(state, crypto.randomUUID());
    if (!intent) return;
    dispatch({ type: 'sent', intent });
    void onSay(intent).then(
      () => dispatch({ type: 'delivered' }),
      () => dispatch({ type: 'failed' }),
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing(event.nativeEvent)) {
      event.preventDefault();
      submit();
      return;
    }
    const atStart = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0;
    if (event.key === 'Backspace' && state.asset && atStart) {
      event.preventDefault();
      dispatch({ type: 'unpicked' });
    }
  };

  const pick = (title: string) =>
    pickMarket({
      title,
      onPick: (market) => {
        dispatch({ type: 'picked', asset: market });
        field.current?.focus();
      },
    });

  return (
    <form
      className="relative flex flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {above}
      <div ref={glass} className="glass-strong glass-lift flex flex-col gap-1 rounded-[1.375rem] p-2">
        <label htmlFor={id} className="sr-only">
          {t('composer.label')}
        </label>
        <div className="flex flex-wrap items-start gap-1.5 px-1 pt-0.5">
          {attachment}
          {code && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-0.5 font-semibold"
              aria-label={t('composer.unpick', { code })}
              onClick={() => {
                dispatch({ type: 'unpicked' });
                field.current?.focus();
              }}
            >
              {code}
              <X aria-hidden />
            </Button>
          )}
          <Textarea
            id={id}
            ref={field}
            rows={1}
            maxLength={MAX_LENGTH}
            enterKeyHint="send"
            value={state.text}
            placeholder={placeholder(code !== null)}
            className="max-h-48 min-h-10 min-w-[12rem] flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 shadow-none hover:border-0 focus-visible:ring-0 md:text-base"
            onChange={(event) => dispatch({ type: 'typed', text: event.target.value })}
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            {pickTitle !== null && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title={pickTitle}
                onClick={() => pick(pickTitle)}
              >
                <Plus aria-hidden />
                <span className={cn(tools && 'max-sm:sr-only')}>{t('composer.pick')}</span>
              </Button>
            )}
            {tools}
          </div>
          <div className="flex items-center gap-1.5">
            <ModelPicker />
            <Button
              type="submit"
              size="icon-md"
              aria-label={t('composer.send')}
              disabled={!ready}
              loading={sending}
            >
              <ArrowUp aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
