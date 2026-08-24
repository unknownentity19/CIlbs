import type { Instrumentation } from "next";
import { reportError } from "@/lib/telemetry";

/**
 * Server-side error hook. Next calls this for every error the server captures,
 * including ones React swallows during streaming — the cases a client-side
 * boundary never sees.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  reportError(error, {
    digest: (error as { digest?: string }).digest,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    renderSource: context.renderSource,
  });
};
