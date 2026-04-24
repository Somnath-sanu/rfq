"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

export const AuthSignIn = () => {
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

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <Link
          className="font-heading text-3xl tracking-tight text-white"
          href="/"
        >
          BidBuddy<sup className="text-xs">&reg;</sup>
        </Link>
        <Button
          asChild
          className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white transition-transform hover:scale-[1.03]"
          variant="ghost"
        >
          <Link href="/">Back home</Link>
        </Button>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl items-center gap-10 px-6 pb-16 pt-8 lg:grid-cols-[1fr_460px]">
        <div className="hidden max-w-2xl lg:block">
          <p className="animate-fade-rise w-fit rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium text-white/80">
            Secure supplier access
          </p>
          <h1
            className="animate-fade-rise-delay mt-7 font-heading text-6xl font-normal leading-[0.95] tracking-[-1.8px] text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Enter the auction room with calm, clear control.
          </h1>
          <p className="animate-fade-rise-delay-2 mt-7 max-w-xl text-lg leading-8 text-white/65">
            Sign in to create RFQs, update quotes, watch rankings, and follow
            every extension event as it happens.
          </p>
        </div>

        <div className="mx-auto w-full max-w-120">
          <SignIn
            fallbackRedirectUrl="/auctions"
            forceRedirectUrl="/auctions"
            routing="path"
            path="/sign-in"
            appearance={{
              variables: {
                colorPrimary: "#ffffff",
                colorBackground: "rgba(6, 23, 34, 0.74)",
                colorInputBackground: "rgba(255, 255, 255, 0.07)",
                colorInputText: "#ffffff",
                colorText: "#ffffff",
                colorTextSecondary: "rgba(255, 255, 255, 0.66)",
                colorNeutral: "rgba(255, 255, 255, 0.62)",
                borderRadius: "1.25rem",
                fontFamily: "var(--font-body)",
                fontSize: "16px",
              },
              elements: {
                rootBox: "w-full",
                cardBox: "w-full shadow-none",
                card:
                  "w-full rounded-[24px] border border-white/10 bg-[#061722]/80 px-7 py-8 shadow-none backdrop-blur-md",
                headerTitle:
                  "font-heading text-[2rem] font-normal tracking-tight text-white",
                headerSubtitle: "text-base leading-6 text-white/60",
                socialButtonsBlockButton:
                  "h-12 rounded-full border-white/15 bg-white/8 text-base font-medium text-white transition hover:bg-white/14",
                socialButtonsBlockButtonText: "text-white",
                dividerLine: "bg-white/12",
                dividerText: "text-white/45",
                formFieldLabel: "text-sm font-medium text-white/72",
                formFieldInput:
                  "h-12 rounded-full border-white/12 bg-white/8 px-4 text-base text-white outline-none focus:border-white/35 focus:ring-white/20",
                formButtonPrimary:
                  "h-12 rounded-full bg-white text-base font-semibold text-[#061722] transition hover:bg-white/90",
                footerActionText: "text-white/55",
                footerActionLink:
                  "font-semibold text-white underline-offset-4 hover:text-white/80",
                identityPreviewText: "text-white",
                formFieldAction: "text-white/75 hover:text-white",
                alternativeMethodsBlockButton:
                  "rounded-full border-white/15 text-white hover:bg-white/10",
                footer: "bg-transparent",
                footerPagesLink: "text-white/55 hover:text-white",
                formFieldErrorText: "text-red-300",
                alert: "rounded-2xl border-red-300/20 bg-red-400/10 text-red-100",
              },
            }}
          />
        </div>
      </section>
    </main>
  );
};
