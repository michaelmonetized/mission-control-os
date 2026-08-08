import { internalMutation } from "./_generated/server";

export const heartbeat = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Lightweight liveness — no-op write optional
    console.log("[cron] system heartbeat", Date.now());
    // Could scan due social posts and enqueue publish jobs later
    void ctx;
  },
});
