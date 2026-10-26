import { cn } from '@reinforce/ui-styles/cn';
import type { Agent, Tint } from '~/shared/api/mock/agents';
import { useAgentStopped } from '../api/agent-store';

const TINT: Record<Tint, string> = {
  violet: 'from-(--palette-violet-400) to-(--palette-violet-600)',
  blue: 'from-(--palette-blue-400) to-(--palette-blue-600)',
  emerald: 'from-(--palette-emerald-400) to-(--palette-emerald-600)',
  amber: 'from-(--palette-amber-300) to-(--palette-amber-500)',
  neutral: 'from-(--palette-neutral-400) to-(--palette-neutral-600)',
};

const SIZE = { sm: 'size-7 [&_svg]:size-3.5', md: 'size-9 [&_svg]:size-4.5' } as const;

export function AgentAvatar({
  agent,
  size = 'md',
  className,
}: {
  readonly agent: Agent;
  readonly size?: keyof typeof SIZE;
  readonly className?: string;
}) {
  const stopped = useAgentStopped(agent.key);
  const Icon = agent.icon;
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-linear-to-br text-white shadow-sm ring-1 ring-foreground/10 ring-inset transition-[filter,opacity] duration-200',
        TINT[agent.tint],
        SIZE[size],
        stopped && 'opacity-45 grayscale',
        className,
      )}
    >
      <Icon strokeWidth={2.1} />
    </span>
  );
}
