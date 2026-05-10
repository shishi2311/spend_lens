import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SpendForm } from "@/components/spend-form";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12 sm:py-20">
      <header className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <Sparkles className="h-4 w-4" />
          </span>
          SpendLens
        </Link>

        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          A second opinion on your AI bill.
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
          Free audit of your AI tool spend. Defensible, citation-backed recommendations on Cursor,
          Claude, Copilot, ChatGPT and more. No login, no credit card, no email until you&apos;ve
          seen the report.
        </p>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">~30 second audit</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">Sources cited</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">Shareable URL</span>
        </div>
      </header>

      <SpendForm />

      <section className="space-y-4 border-t pt-8 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">How this works</h2>
        <ol className="space-y-2 pl-5 [&>li]:list-decimal">
          <li>
            You tell us which AI tools you pay for, what plan, monthly spend, and seats. Form state
            saves locally so you can come back later.
          </li>
          <li>
            We run the numbers against current vendor pricing — same-vendor downgrades, cheaper
            alternatives, and credit-market angles. Every dollar traces to a vendor URL.
          </li>
          <li>
            You see the audit before we ever ask for an email. If it&apos;s useful, we&apos;ll send
            you the report and notify you when new optimizations apply to your stack.
          </li>
        </ol>
        <p className="flex items-center gap-1 pt-2 text-xs">
          Built by Credex — discounted AI infrastructure credits.{" "}
          <a
            href="https://credex.rocks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-primary hover:underline"
          >
            credex.rocks <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
      </section>
    </main>
  );
}
