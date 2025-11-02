import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { PharmacySidebar } from "./PharmacySidebar"
import { Bell, User, LogOut, Settings, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface PharmacyLayoutProps {
  children: React.ReactNode
}

export function PharmacyLayout({ children }: PharmacyLayoutProps) {
  const { signOut, user, profile } = useAuth();
  const { notifications, loading } = useNotifications();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <PharmacySidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 md:h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-3 md:px-6">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden md:block">
                <h1 className="text-lg md:text-xl font-semibold">Pharmacy Management System</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Professional healthcare solutions</p>
              </div>
              <div className="md:hidden">
                <h1 className="text-lg font-semibold">PharmaPOS</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
                    <Bell className="h-3 w-3 md:h-4 md:w-4" />
                    {!loading && notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 md:w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium">Notifications</h4>
                    {loading ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <Badge
                              variant={
                                notification.type === "error" ? "destructive" :
                                notification.type === "warning" ? "secondary" : "default"
                              }
                              className="mt-1 text-xs"
                            >
                              {notification.type}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                    <User className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 md:w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-sm">{profile?.full_name || user?.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'user'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}