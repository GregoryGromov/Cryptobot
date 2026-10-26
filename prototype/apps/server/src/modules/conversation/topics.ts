export const isTalk = (topic: string): boolean => /^talk-[0-9a-f-]{36}$/i.test(topic);
export const isGeneral = (topic: string): boolean => topic === 'broker' || isTalk(topic);
export const topicHref = (topic: string): string =>
  topic === 'broker'
    ? '/c'
    : isTalk(topic)
      ? `/c/${encodeURIComponent(topic.slice(5))}`
      : `/m/${encodeURIComponent(topic)}`;
export function withoutAssetCode(text: string, topic: string): string {
  if (isGeneral(topic)) return text;
  const code = `$${topic.replace(/^xyz:/, '')}`;
  const rest = text.slice(code.length);
  return text.slice(0, code.length).toUpperCase() === code.toUpperCase() && /^\s+\S/.test(rest)
    ? rest.trim()
    : text;
}
