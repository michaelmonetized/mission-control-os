# Social publish failure: notify + preserve narrative order

When a Social Post fails to publish (channel/API/Connected Account error):

1. **Notify** both **Agency** operators (relevant to that Client) and **Client Users** with:
   - failure reason  
   - post details (copy, media refs, link, channel, intended schedule)  
2. **Auto-reschedule** the failed post into the **first open slot before the next scheduled Social Post** on that calendar/stream (same channel/Campaign context as product defines), so sequence and storytelling stay intact.

## Why

Campaigns are engineered as a **narrative over time**. A missed post is not only a failed send—it can change story order, growth trajectory, and visibility. Silent failure or “drop and continue” breaks the arc; parking the post in the next gap preserves order better than skipping or dumping at end of queue.

## Consequences

- Scheduler needs gap detection (“first slot before next scheduled post”) with timezone and channel-specific spacing rules.
- Failure events are first-class (audit log + notifications via email/in-app).
- Repeated failure (e.g. revoked OAuth) should escalate and pause full auto for that Connected Account after N failures (implementation threshold later).
- Extends ADR-0037; does not change default-approved publish rules.
