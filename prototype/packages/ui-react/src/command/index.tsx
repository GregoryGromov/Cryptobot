import {
  commandEmptyClass,
  commandGroupClass,
  commandGroupHeadingClass,
  commandInputClass,
  commandInputHintClass,
  commandInputIconClass,
  commandInputWrapperClass,
  commandItemClass,
  commandItemLabelClass,
  commandItemSubtitleClass,
  commandItemTitleClass,
  commandListClass,
  commandRootClass,
} from '@reinforce/ui-primitives/command';
import { cn } from '@reinforce/ui-styles/cn';
import { SearchIcon, SearchXIcon } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Kbd } from '../kbd/index.js';

export interface CommandItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly group?: string;
  readonly groupLabel?: string;
  readonly keywords?: readonly string[];
  readonly icon?: ReactNode;
  readonly trailing?: ReactNode;
  readonly run: () => void;
}

export interface CommandSearchProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly items: readonly CommandItem[];
  readonly placeholder: string;
  readonly emptyLabel: string;
}

interface FilteredGroup {
  readonly key: string;
  readonly label: string | undefined;
  readonly items: readonly CommandItem[];
}

const matchesQuery = (item: CommandItem, query: string): boolean => {
  if (query === '') return true;
  const hay = [item.label, item.description ?? '', ...(item.keywords ?? [])].join(' ').toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => hay.includes(token));
};

const filterAndGroup = (items: readonly CommandItem[], query: string): readonly FilteredGroup[] => {
  const buckets = new Map<string, { label: string | undefined; items: CommandItem[] }>();
  for (const item of items) {
    if (!matchesQuery(item, query)) continue;
    const key = item.group ?? '_';
    const bucket = buckets.get(key) ?? { label: item.groupLabel, items: [] };
    bucket.items.push(item);
    buckets.set(key, bucket);
  }
  return Array.from(buckets, ([key, { label, items: list }]) => ({ key, label, items: list }));
};

const flatten = (groups: readonly FilteredGroup[]): readonly CommandItem[] => groups.flatMap((g) => g.items);

export function CommandSearch({ open, onClose, items, placeholder, emptyLabel }: CommandSearchProps) {
  const [query, setQuery] = useState('');
  const [rawActiveIndex, setActiveIndex] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const groups = useMemo(() => filterAndGroup(items, query), [items, query]);
  const flat = useMemo(() => flatten(groups), [groups]);
  const activeIndex = Math.min(rawActiveIndex, Math.max(0, flat.length - 1));

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-command-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const runActive = () => {
    const item = flat[activeIndex];
    if (!item) return;
    onClose();
    item.run();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(0, flat.length - 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      runActive();
    }
  };

  return (
    <div className={commandRootClass}>
      <div className={commandInputWrapperClass}>
        <SearchIcon className={commandInputIconClass} strokeWidth={1.75} aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-controls={listId}
          aria-expanded
          aria-activedescendant={flat[activeIndex] ? `${listId}-${flat[activeIndex].id}` : undefined}
          autoComplete="off"
          spellCheck={false}
          className={commandInputClass}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
        />
        <span className={commandInputHintClass} aria-hidden>
          <Kbd size="sm">esc</Kbd>
        </span>
      </div>
      <div ref={listRef} className={commandListClass} role="listbox" id={listId}>
        {flat.length === 0 ? (
          <div className={commandEmptyClass}>
            <SearchXIcon className="size-5 opacity-60" strokeWidth={1.5} aria-hidden />
            <span>{emptyLabel}</span>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key} className={commandGroupClass}>
              {group.label && <div className={commandGroupHeadingClass}>{group.label}</div>}
              {group.items.map((item) => {
                const flatIndex = flat.indexOf(item);
                const active = flatIndex === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    id={`${listId}-${item.id}`}
                    data-command-index={flatIndex}
                    data-active={active}
                    aria-selected={active}
                    className={cn(commandItemClass, 'text-left')}
                    onMouseMove={() => setActiveIndex(flatIndex)}
                    onClick={() => {
                      onClose();
                      item.run();
                    }}
                  >
                    {item.icon}
                    <span className={commandItemLabelClass}>
                      <span className={commandItemTitleClass}>{item.label}</span>
                      {item.description && (
                        <span className={commandItemSubtitleClass}>{item.description}</span>
                      )}
                    </span>
                    {item.trailing}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
