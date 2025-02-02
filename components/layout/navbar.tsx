"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Eye } from "lucide-react"

const routes = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Workflows",
    href: "/workflows",
  },
]

export function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <header className="flex h-20 w-full shrink-0 items-center border-b bg-background/95 backdrop-blur px-4 md:px-6">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="flex flex-col gap-2 py-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex w-full items-center py-2 text-lg font-semibold transition-colors hover:text-primary",
                  pathname === route.href ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                {route.title}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/" className="flex items-center space-x-2 ml-4 lg:ml-0">
        <Eye className="h-6 w-6" />
        <span className="font-bold text-xl hidden sm:inline-block">Overseer</span>
      </Link>

      <nav className="ml-auto hidden lg:flex gap-6">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground focus:outline-none",
              "disabled:pointer-events-none disabled:opacity-50",
              pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            {route.title}
          </Link>
        ))}
      </nav>
    </header>
  )
} 