"use client"

import * as React from "react"
import {
  IconBug,
  IconHelp,
  IconKey,
  IconLayoutDashboard,
  IconPlugConnected,
  IconRadar,
  IconSettings,
  IconSubtask,
  IconWorld,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    title: "Domains",
    url: "/dashboard/domains",
    icon: IconWorld,
  },
  {
    title: "Subdomains",
    url: "/dashboard/subdomains",
    icon: IconSubtask,
  },
  {
    title: "Ports",
    url: "/dashboard/ports",
    icon: IconPlugConnected,
  },
  {
    title: "Probed Hosts",
    url: "/dashboard/probed",
    icon: IconRadar,
  },
  {
    title: "Vulnerabilities",
    url: "/dashboard/vulnerabilities",
    icon: IconBug,
  },
]

const navSecondary = [
  {
    title: "API Tokens",
    url: "/dashboard/tokens",
    icon: IconKey,
  },
  {
    title: "Settings",
    url: "#",
    icon: IconSettings,
  },
  {
    title: "Help",
    url: "#",
    icon: IconHelp,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconRadar className="!size-5 text-primary" />
                <span className="text-base font-semibold">Radon</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
