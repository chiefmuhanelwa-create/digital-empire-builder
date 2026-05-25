import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-banana" />
          <span className="font-mono text-sm tracking-[0.18em] uppercase">CHKPLT</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/products" className="hover:text-foreground transition-colors">Catalog</Link>
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
        <div className="font-mono tracking-[0.18em] uppercase">CHKPLT — Digital Empire OS</div>
        <div>© {new Date().getFullYear()} CHKPLT. All rights reserved.</div>
      </div>
    </footer>
  );
}
