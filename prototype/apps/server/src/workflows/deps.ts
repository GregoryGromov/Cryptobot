import type { AtpSignalPort } from '../adapters/atp-signal.js';
import type { ExchangeCandlesPort } from '../adapters/hyperliquid.js';
import type { ExchangeStatsPort } from '../adapters/hyperliquid-stats.js';
import type { XaiAuthPort } from '../adapters/xai-auth.js';
import type { OwnModelPort } from '../adapters/xai-model.js';
import type { Clock } from '../kernel/time.js';
import type { Config } from '../platform/config.js';
import type { Database } from '../platform/db.js';
import type { Jobs } from '../platform/jobs.js';

export type Deps = {
  db: Database;
  jobs: Jobs;
  clock: Clock;
  config: Config;
  shutdown?: AbortSignal;
  xaiAuth?: XaiAuthPort;
  ownModel?: OwnModelPort;
  marketSource?: AtpSignalPort;
  /** Live only: the exchange's own minutes while atp-signal has not stored them. */
  exchangeCandles?: ExchangeCandlesPort;
  /** Live only: the exchange's funding, open interest and day per market. */
  exchangeStats?: ExchangeStatsPort;
};
