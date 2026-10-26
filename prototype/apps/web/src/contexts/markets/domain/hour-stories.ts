import type { MarketList } from '@reinforce/server/dto';
import { type Direction, directionOf } from '~/shared/format/percent';

type StoryId = 'alts' | 'stock' | 'commodities';

type MockMarket = {
  readonly coin: string;
  readonly ticker: string;
  readonly change: number;
  readonly moves: readonly number[];
};

type MockStory = {
  readonly id: StoryId;
  readonly markets: readonly MockMarket[];
  readonly against: MockMarket | null;
};

export type StoryMarket = {
  readonly coin: string;
  readonly ticker: string;
  readonly name: string;
  readonly topic: string | null;
  readonly change: number;
  readonly direction: Direction;
  readonly moves: readonly number[];
};

export type HourStory = {
  readonly id: StoryId;
  readonly direction: Direction;
  readonly markets: readonly StoryMarket[];
  readonly against: StoryMarket | null;
  readonly topic: string | null;
};

const CHANGE_DIGITS = 2;

// A mock: the server does not write stories yet, so these stand frozen at one hour of 2026-10-12.
const MOCK_STORIES: readonly MockStory[] = [
  {
    id: 'alts',
    markets: [
      {
        coin: 'PUMP',
        ticker: 'PUMP',
        change: -1.71,
        moves: [
          0, -0.625, 0.11, -0.018, 0, -0.331, -0.276, -0.166, -0.074, 0.147, 0.092, 0.037, -0.239, -0.349,
          -0.46, -0.92, -0.515, -0.331, -0.349, -0.423, -0.828, -0.828, -1.196, -1.067, -0.754, -1.085,
          -1.527, -1.563, -1.343, -1.324, -1.711,
        ],
      },
      {
        coin: 'ENA',
        ticker: 'ENA',
        change: -0.6,
        moves: [
          0, -0.161, 0.255, -0.058, -0.17, -0.336, -0.121, -0.063, 0.045, -0.13, 0.116, 0.125, -0.202, -0.224,
          -0.076, -0.255, -0.448, -0.233, -0.157, -0.063, -0.39, -0.157, -0.063, -0.13, -0.3, -0.421, -0.479,
          -0.425, -0.381, -0.408, -0.605,
        ],
      },
      {
        coin: 'ZEC',
        ticker: 'ZEC',
        change: -0.38,
        moves: [
          0, 0.079, 0.205, 0.244, -0.047, -0.181, -0.197, -0.055, 0.071, 0.37, 0.394, 0.299, 0.165, 0.165,
          -0.181, -0.355, -0.205, 0.102, 0.063, 0.236, 0.039, 0.292, 0.15, 0.15, 0.165, -0.008, -0.008,
          -0.079, -0.244, -0.268, -0.378,
        ],
      },
    ],
    against: {
      coin: 'BTC',
      ticker: 'BTC',
      change: -0.01,
      moves: [
        0, -0.033, -0.129, -0.246, -0.347, -0.179, -0.133, -0.175, -0.104, -0.156, -0.112, -0.089, -0.06,
        -0.092, -0.111, 0.004, -0.013, -0.006, 0.033, 0.021, 0.092, 0, -0.008, 0.006, -0.052, 0.006, 0.01,
        -0.008, 0.045, -0.011, -0.015,
      ],
    },
  },
  {
    id: 'stock',
    markets: [
      {
        coin: 'xyz:SNDK',
        ticker: 'SNDK',
        change: 0.98,
        moves: [
          0, -0.014, 0.143, 0.224, 0.252, 0.354, 0.136, 0.238, 0.483, 0.381, 0.592, 0.619, 0.592, 0.524,
          0.612, 0.551, 0.462, 0.578, 0.544, 0.775, 0.544, 0.592, 0.585, 0.762, 0.986, 0.789, 0.816, 0.877,
          0.939, 0.939, 0.979,
        ],
      },
    ],
    against: {
      coin: 'xyz:SP500',
      ticker: 'SP500',
      change: 0.05,
      moves: [
        0, 0.006, -0.001, 0.017, 0, 0.003, 0.008, 0.013, 0.036, 0.035, 0.04, 0.049, 0.044, 0.042, 0.049,
        0.046, 0.033, 0.064, 0.06, 0.056, 0.053, 0.015, 0.01, 0, 0.015, 0.009, 0.01, 0.029, 0.036, 0.05,
        0.053,
      ],
    },
  },
  {
    id: 'commodities',
    markets: [
      {
        coin: 'xyz:CL',
        ticker: 'CL',
        change: -0.13,
        moves: [
          0, -0.04, -0.08, -0.093, -0.109, -0.005, -0.051, 0.019, -0.053, -0.063, -0.118, -0.147, -0.255,
          -0.272, -0.26, -0.163, -0.3, -0.262, -0.295, -0.418, -0.275, -0.37, -0.145, -0.169, -0.202, -0.283,
          -0.028, -0.021, -0.048, -0.071, -0.131,
        ],
      },
      {
        coin: 'xyz:BRENTOIL',
        ticker: 'BRENTOIL',
        change: -0.14,
        moves: [
          0, -0.029, -0.077, -0.096, -0.163, -0.048, -0.038, 0.058, -0.029, -0.029, -0.077, -0.125, -0.317,
          -0.326, -0.307, -0.221, -0.297, -0.278, -0.345, -0.403, -0.297, -0.393, -0.182, -0.182, -0.221,
          -0.297, -0.038, -0.019, -0.048, -0.115, -0.144,
        ],
      },
      {
        coin: 'xyz:SILVER',
        ticker: 'SILVER',
        change: -0.13,
        moves: [
          0, 0.031, -0.015, -0.069, -0.005, -0.038, -0.114, -0.119, -0.121, -0.139, -0.086, -0.116, -0.108,
          -0.079, -0.041, -0.131, -0.078, -0.05, -0.008, -0.048, 0.013, 0.002, -0.177, -0.225, -0.159, -0.142,
          -0.174, -0.18, -0.184, -0.131, -0.131,
        ],
      },
    ],
    against: null,
  },
];

export const hourStories = (list: MarketList): readonly HourStory[] => {
  const listed = new Map(list.flatMap((group) => group.markets).map((market) => [market.coin, market]));
  const told = (mock: MockMarket): StoryMarket => {
    const market = listed.get(mock.coin);
    return {
      coin: mock.coin,
      ticker: mock.ticker,
      name: market?.name ?? mock.ticker,
      topic: market?.key ?? null,
      change: mock.change,
      direction: directionOf(mock.change, CHANGE_DIGITS),
      moves: mock.moves,
    };
  };
  return MOCK_STORIES.map((story): HourStory => {
    const markets = story.markets.map(told);
    return {
      id: story.id,
      direction: markets[0]?.direction ?? 'flat',
      markets,
      against: story.against === null ? null : told(story.against),
      topic: markets.find((market) => market.topic !== null)?.topic ?? null,
    };
  });
};
