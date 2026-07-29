import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

// A single, consistent back-navigation pattern reused across every page that
// would otherwise be a dead end (only the header/footer to escape via) —
// founder's explicit ask for back navigation "across the whole store."
export function BackNav({
  to,
  label = "Back",
  className = "",
}: {
  to: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 text-[13px] font-medium text-[#666] hover:text-[#000] transition-colors ${className}`}
    >
      <ArrowLeft className="size-3.5" />
      {label}
    </Link>
  );
}
