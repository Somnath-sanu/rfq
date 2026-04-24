import { ModeToggle } from "@/components/theme-toggle";
import { IconGavel } from "@tabler/icons-react";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IconGavel className="size-5" />
          </span>
          <span>
            <span className="block font-heading text-lg font-semibold">
              BidBuddy
            </span>
            <span className="block text-xs text-muted-foreground">
              British Auction RFQ
            </span>
          </span>
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
};
