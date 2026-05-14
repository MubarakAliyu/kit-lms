export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "development"
  ) {
    try {
      const { server } = await import("./_lib/mocks/server");
      server.listen({ onUnhandledRequest: "bypass" });
      console.log("[MSW] Node server started");
    } catch (e) {
      console.warn("[MSW] Node server failed:", e.message);
    }
  }
}
