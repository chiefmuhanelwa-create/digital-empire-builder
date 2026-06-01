import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { GARDEN_ORDER, GARDENS } from "@/lib/gardens";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-base font-bold tracking-[0.22em] uppercase text-banana">
            CHKPLT
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 hover:text-foreground transition-colors outline-none">
              Shop <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuItem asChild>
                <Link to="/products" className="flex flex-col items-start gap-0.5 py-2">
                  <span className="font-mono text-xs tracking-[0.2em] uppercase text-banana">Everything</span>
                  <span className="text-xs text-muted-foreground">Browse the full shop</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {GARDEN_ORDER.map((g) => {
                const m = GARDENS[g];
                return (
                  <DropdownMenuItem key={g} asChild>
                    <Link
                      to="/products/garden/$garden"
                      params={{ garden: g }}
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <span className="font-display text-base">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.tagline}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
              <Button
                asChild
                size="sm"
                className="cta-glow tracking-wide px-4 py-2 rounded-md"
              >
                <Link to="/signup">Access Vault</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm flex flex-col gap-0 p-0">
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle className="font-mono text-xs tracking-[0.2em] uppercase text-left">Menu</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              <div>
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">Shop</div>
                <Link
                  to="/products"
                  onClick={close}
                  className="block py-2 font-display text-xl"
                >
                  Everything
                </Link>
                <div className="mt-2 space-y-1">
                  {GARDEN_ORDER.map((g) => {
                    const m = GARDENS[g];
                    return (
                      <Link
                        key={g}
                        to="/products/garden/$garden"
                        params={{ garden: g }}
                        onClick={close}
                        className="block py-2"
                      >
                        <div className="font-display text-base">{m.name}</div>
                        <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                          {m.tagline}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-2">
                <Link to="/about" onClick={close} className="block py-2 font-display text-xl">About</Link>
                <Link to="/contact" onClick={close} className="block py-2 font-display text-xl">Contact</Link>
              </div>
            </div>

            <div className="border-t border-border px-6 py-5 space-y-2">
              {user ? (
                <>
                  <Button asChild className="w-full" variant="outline" onClick={close}>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={() => { close(); signOut(); }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    className="cta-glow w-full tracking-wide"
                    onClick={close}
                  >
                    <Link to="/signup">Access Vault</Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline" onClick={close}>
                    <Link to="/login">Sign in</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="font-mono tracking-[0.18em] uppercase">CHKPLT — Kingdom Contentpreneurs</div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/refund-policy" className="hover:text-foreground transition-colors">Refunds</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </nav>
        <div>© {new Date().getFullYear()} Christ Kingdom Platform. All rights reserved.</div>
      </div>
    </footer>
  );
}
