import { redirect, type RegisteredRouter } from '@tanstack/react-router'

/** TanStack Router redirects use throw for control flow (not Error instances). */
export function routerRedirect(
  options: Parameters<typeof redirect<RegisteredRouter, string, string>>[0],
): never {
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- framework redirect object
  throw redirect(options)
}
