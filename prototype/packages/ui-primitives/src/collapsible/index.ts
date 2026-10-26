export const collapsibleContentClass =
  'overflow-hidden duration-(--motion-duration-standard) data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up motion-reduce:animate-none';

export const disclosureChevronClass =
  'pointer-events-none shrink-0 motion-safe:transition-transform duration-(--motion-duration-quick) ease-(--motion-ease-standard) [[aria-expanded=true]>&]:rotate-180';
