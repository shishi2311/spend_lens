import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold tracking-tight">This audit doesn&apos;t exist.</h1>
      <p className="text-muted-foreground">
        The link may be expired or mistyped. Run a fresh audit — it takes about 30 seconds.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Audit my AI spend
      </Link>
    </main>
  );
}
