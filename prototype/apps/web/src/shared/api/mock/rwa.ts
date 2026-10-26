export type RwaAsset = {
  readonly ticker: string;
  readonly name: string;
  readonly issuer: string;
  readonly chain: string;
  readonly backing: string;
  readonly price: string;
  readonly change: number | null;
  readonly yield: string | null;
  readonly logo: string | null;
};

export type RwaGroup = {
  readonly key: 'gold' | 'stocks' | 'bonds' | 'estate';
  readonly title: string;
  readonly lead: string;
  readonly assets: readonly RwaAsset[];
};

export const RWA_GROUPS: readonly RwaGroup[] = [
  {
    key: 'gold',
    title: 'Золото',
    lead: 'Каждый токен обеспечен физическим золотом в хранилище',
    assets: [
      {
        ticker: 'PAXG',
        name: 'Paxos Gold',
        issuer: 'Paxos',
        chain: 'Ethereum',
        backing: '1 токен = 1 тройская унция, хранилища в Лондоне',
        price: '$4 118',
        change: 0.4,
        yield: null,
        logo: '/logos/paxg.svg',
      },
      {
        ticker: 'XAUT',
        name: 'Tether Gold',
        issuer: 'Tether',
        chain: 'Ethereum',
        backing: '1 токен = 1 тройская унция, хранилища в Швейцарии',
        price: '$4 112',
        change: 0.3,
        yield: null,
        logo: '/logos/gold.svg',
      },
    ],
  },
  {
    key: 'stocks',
    title: 'Акции',
    lead: 'Токены 1:1 к акциям у кастодиана, торгуются 24/7',
    assets: [
      {
        ticker: 'NVDAx',
        name: 'Nvidia',
        issuer: 'xStocks',
        chain: 'Solana',
        backing: '1 токен = 1 акция NVDA',
        price: '$188,40',
        change: 1.2,
        yield: null,
        logo: '/logos/nvda.svg',
      },
      {
        ticker: 'TSLAx',
        name: 'Tesla',
        issuer: 'xStocks',
        chain: 'Solana',
        backing: '1 токен = 1 акция TSLA',
        price: '$431,10',
        change: -0.8,
        yield: null,
        logo: '/logos/tsla.svg',
      },
      {
        ticker: 'AAPLx',
        name: 'Apple',
        issuer: 'xStocks',
        chain: 'Solana',
        backing: '1 токен = 1 акция AAPL',
        price: '$258,60',
        change: 0.2,
        yield: null,
        logo: '/logos/aapl.svg',
      },
      {
        ticker: 'SPYx',
        name: 'S&P 500 ETF',
        issuer: 'xStocks',
        chain: 'Solana',
        backing: '1 токен = 1 пай SPY',
        price: '$671,30',
        change: 0.5,
        yield: null,
        logo: '/logos/spx.svg',
      },
    ],
  },
  {
    key: 'bonds',
    title: 'Облигации США',
    lead: 'Доход от казначейских облигаций, начисляется каждый день',
    assets: [
      {
        ticker: 'USDY',
        name: 'Ondo US Dollar Yield',
        issuer: 'Ondo',
        chain: 'Ethereum',
        backing: 'Краткосрочные облигации США и банковские депозиты',
        price: '$1,11',
        change: null,
        yield: '4,3%',
        logo: null,
      },
    ],
  },
  {
    key: 'estate',
    title: 'Недвижимость',
    lead: 'Доля в доме, арендный доход приходит в стейблах',
    assets: [
      {
        ticker: 'REALT',
        name: 'Жилой дом, Детройт',
        issuer: 'RealT',
        chain: 'Gnosis',
        backing: 'Доля в LLC, которой принадлежит дом',
        price: '$54,20',
        change: null,
        yield: '9,8%',
        logo: null,
      },
    ],
  },
];

export const RWA_SHOWCASE: readonly { readonly ticker: string; readonly label: string; readonly logo: string }[] = [
  { ticker: 'PAXG', label: 'Золото', logo: '/logos/gold.svg' },
  { ticker: 'TSLAx', label: 'Tesla', logo: '/logos/tsla.svg' },
  { ticker: 'AAPLx', label: 'Apple', logo: '/logos/aapl.svg' },
  { ticker: 'NVDAx', label: 'Nvidia', logo: '/logos/nvda.svg' },
];

export const rwaAsset = (ticker: string): RwaAsset | undefined =>
  RWA_GROUPS.flatMap((group) => group.assets).find((asset) => asset.ticker === ticker);
