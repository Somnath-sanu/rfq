import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { IconGavel, IconHome, IconLayoutDashboard } from "@tabler/icons-react";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-background/70 backdrop-blur-xl dark:bg-[#07131c]/82">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link className="flex items-center gap-3" href="/auctions">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <IconGavel className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-heading text-2xl font-normal leading-none tracking-tight">
              BidBuddy
            </span>
            <span className="block pt-1 text-sm text-muted-foreground">
              British Auction RFQ
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/">
              <IconHome aria-hidden="true" />
              Home
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/auctions">
              <IconLayoutDashboard aria-hidden="true" />
              Auctions
            </Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
