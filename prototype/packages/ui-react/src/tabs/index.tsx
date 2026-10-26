import {
  type TabsListVariants,
  type TabsTriggerVariants,
  tabsContentClass,
  tabsListVariants,
  tabsRootClass,
  tabsTriggerVariants,
} from '@reinforce/ui-primitives/tabs';
import { cn } from '@reinforce/ui-styles/cn';
import { Tabs as TabsPrimitive } from 'radix-ui';
import type * as React from 'react';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(tabsRootClass, className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & TabsListVariants) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & TabsTriggerVariants) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-size={size}
      className={cn(tabsTriggerVariants({ size }), className)}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content data-slot="tabs-content" className={cn(tabsContentClass, className)} {...props} />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
