"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Something went wrong.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={reset} className="mt-8">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
