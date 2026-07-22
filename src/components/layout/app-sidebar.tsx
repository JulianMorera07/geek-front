'use client';

import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export interface AppSidebarNavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  badge?: string;
}

export interface AppSidebarNavGroup {
  label?: string;
  items: AppSidebarNavItem[];
}

export interface AppSidebarProps {
  groups: AppSidebarNavGroup[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Sidebar de navegación del shell de app. Debe montarse dentro de
 * `SidebarProvider`, junto a `SidebarInset` para el contenido y
 * `SidebarTrigger` en el Navbar para el toggle. Colapsa a modo ícono en
 * desktop y a Sheet en mobile (comportamiento heredado de `ui/sidebar`).
 */
function AppSidebar({ groups, header, footer }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      {header ? <SidebarHeader>{header}</SidebarHeader> : null}
      <SidebarContent>
        {groups.map((group, index) => (
          <SidebarGroup key={group.label ?? index}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      tooltip={item.title}
                      render={<Link href={item.url} />}
                    >
                      {item.icon ? <item.icon /> : null}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
    </Sidebar>
  );
}

export { AppSidebar };
export { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
