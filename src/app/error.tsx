"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { reportError } from "@/lib/telemetry";

/**
 * Route-level error boundary. Catches anything thrown while rendering a page
 * and offers a retry instead of leaving the visitor on a blank screen.
 */
export default function RouteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "route", digest: error.digest });
  }, [error]);

  return (
    <Section className="py-24">
      <Container>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Something broke on this page
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            The error has been reported. Retrying reloads just this section — you
            won&apos;t lose anything else you had open.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">
              ref {error.digest}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button onClick={() => unstable_retry()}>
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
            <Button href="/" variant="outline">
              Back to home
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
