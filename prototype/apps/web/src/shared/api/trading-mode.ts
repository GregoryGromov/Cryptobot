import { type Horizon, MODE_HORIZON, type TradingMode } from '@reinforce/server/dto';
import { useSession } from './session';

const USUAL_MODE: TradingMode = 'daytrader';

export const useTradingMode = (): { readonly mode: TradingMode; readonly horizon: Horizon } => {
  const mode = useSession().data?.preferences.mode ?? USUAL_MODE;
  return { mode, horizon: MODE_HORIZON[mode] };
};
