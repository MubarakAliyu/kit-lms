// Next.js runtime hook — runs once when the dev server boots. We use it to
// stand up the MSW Node server in development so that NextAuth's server-side
// authorize() (which calls POST /login via axios) is intercepted by the
// same handlers that the browser worker uses.
export async function register() {
  if (process.env.NODE_ENV !== "development") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { server } = await import("./src/_lib/mocks/server");
  server.listen({ onUnhandledRequest: "bypass" });
}
