"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Authenticated, Unauthenticated } from "convex/react";
import { useClerk } from "@clerk/nextjs";

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

export default function Home() {
  const { signOut } = useClerk();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#002b42] text-white">
      <video
        autoPlay
        className="absolute inset-0 z-0 h-full w-full object-cover"
        loop
        muted
        playsInline
        src={videoUrl}
      />

      <nav className="relative z-10 mx-auto flex max-w-7xl flex-row items-center justify-between px-8 py-6">
        <Link
          className="font-heading text-3xl tracking-tight text-white"
          href="/"
        >
          BidBuddy<sup className="text-xs"></sup>
        </Link>
        <Unauthenticated>
          <Button
            asChild
            className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white transition-transform hover:scale-[1.03]"
            variant="ghost"
          >
            <Link href="/sign-in/">Sign in</Link>
          </Button>
        </Unauthenticated>
        <Authenticated>
          <div className="flex gap-x-2">
            <Button
              asChild
              className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white transition-transform hover:scale-[1.03]"
              variant="ghost"
            >
              <Link href="/auctions" prefetch>
                Begin Journey
              </Link>
            </Button>
            <p></p>

            <Button
              className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white transition-transform hover:scale-[1.03] cursor-pointer"
              variant="ghost"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          </div>
        </Authenticated>
      </nav>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] max-w-7xl flex-col items-center justify-center px-6 pb-28 pt-15 text-center">
        <h1
          className="animate-fade-rise max-w-6xl font-heading text-5xl font-normal leading-[0.95] tracking-[-1.8px] text-white sm:text-7xl md:text-8xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Where bids move <em className="not-italic text-white/60">with</em>{" "}
          clarity and control.
        </h1>
        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
          BidBuddy brings British Auction RFQs into one focused workspace: live
          rankings, extension rules, transparent activity, and supplier quote
          updates without realtime infrastructure overhead.
        </p>
      </section>
    </main>
  );
}
