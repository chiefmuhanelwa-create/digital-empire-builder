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
import { ChevronDown } from "lucide-react";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-banana" />
          <span className="font-mono text-sm tracking-[0.18em] uppercase">CHKPLT</span>
        </Link>
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
                      <span className="font-display text-base">{m.name} — {m.priceRange}</span>
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
        <div className="flex items-center gap-2">
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
              <Button asChild size="sm" className="bg-banana text-banana-foreground hover:bg-banana/90">
                <Link to="/signup">Get access</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="font-mono tracking-[0.18em] uppercase">CHKPLT — Tools for creators</div>
        <div>© {new Date().getFullYear()} CHKPLT. All rights reserved.</div>
      </div>
    </footer>
  );
}
