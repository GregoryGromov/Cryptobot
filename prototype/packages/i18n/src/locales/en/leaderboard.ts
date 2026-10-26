export default {
  title: 'Leaderboard',
  finish: 'finish {{day}}',
  left: '{{days}} d {{hours}} h left',
  over: 'finished',
  place: {
    figure: '#{{rank}}',
    label: 'Your place',
    of: 'of {{total}}',
    day: 'in a day',
  },
  return: {
    label: 'Return',
    better: 'ahead of {{share}} of entrants',
  },
  next: {
    label: 'To #{{rank}}',
    first: 'You lead',
  },
  race: {
    title: 'Race',
    mode: 'Who to show on the chart',
    modes: { leaders: 'Leaders', neighbors: 'Neighbours' },
    me: 'You · #{{rank}}',
    finish: 'Finish',
    summary:
      'Entrants’ return from {{from}} to today: yours {{mine}}, the leader’s {{best}}, BTC {{benchmark}}',
  },
  list: {
    label: 'Entrants',
    you: 'You',
    handle: '@{{handle}}',
    more_one: '{{count}} more entrant',
    more_other: '{{count}} more entrants',
    rank: 'place {{rank}}',
    up_one: 'up {{count}} place in a day',
    up_other: 'up {{count}} places in a day',
    down_one: 'down {{count}} place in a day',
    down_other: 'down {{count}} places in a day',
    still: 'same place as a day ago',
  },
  rules: 'Everyone starts with $10,000 · ranked from 5 trades · entrants and results are an example for now',
  pill: {
    label: 'Leaderboard',
    you: 'You',
    toNext: 'to #{{rank}}',
    go: 'Standings',
  },
};
