"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
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
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  Settings2Icon,
  MegaphoneIcon,
  PackageIcon,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const data = {
  user: {
    name: "Admin",
    email: "admin@farmgreens.in",
    avatar: "/assets/farm-greens-logo.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/fmg-admin",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Products",
      url: "/fmg-admin/products",
      icon: <ListIcon />,
    },
    {
      title: "Customers",
      url: "/fmg-admin/customers",
      icon: <ChartBarIcon />,
    },
    {
      title: "Orders",
      url: "/fmg-admin/orders",
      icon: <FolderIcon />,
    },
    {
      title: "Campaigns",
      url: "/fmg-admin/campaigns",
      icon: <MegaphoneIcon />,
    },
    {
      title: "Combos",
      url: "/fmg-admin/combos",
      icon: <PackageIcon />,
    },
    {
      title: "Settings",
      url: "/fmg-admin/settings",
      icon: <Settings2Icon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/fmg-admin">
                <Image
                  src="/assets/farm-greens-logo.png"
                  alt="FarmGreens Logo"
                  width={40}
                  height={40}
                  className="size-10 object-contain"
                />
                <span className="text-base font-semibold">FarmGreens</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
