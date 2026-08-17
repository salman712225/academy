<!-- Source: https://app.snapserve.ai/docs/calendar -->

# Bookings calendar

Let agents check availability and book appointments on Google Calendar. Separate from Meeting bots that join video rooms.

Booking ≠ join

**Connections → Bookings calendar** creates invites (often with a Meet link). **Meeting bots** (`/app/meet`) join a room that already exists. See the [Meetings guide](/docs/meetings).
## 1. Connect Google

1. Go to [Connections → Bookings calendar](https://app.snapserve.ai/app/connections?setup=calendar) in the dashboard.
1. Create or open a calendar and connect a Google account.
1. Grant calendar read/write scopes SnapServe requests.

## 2. Event types & availability

Define what can be booked (duration, buffers) and when you are free. Availability rules drive slot search during the call.

## 3. Link the agent

1. Open the agent builder → Tools → Booking.
1. Select the calendar (and event type) for booking tools.
1. **Save the agent first** before enabling calendar tools if the UI prompts you.
1. Test with a live or web-call: ask to book a slot and confirm it appears in Google.

Common mistakes

No Google account on the calendar, wrong calendar linked to the agent, or agent not saved after tool changes. Confirm Connections → Bookings calendar shows a connected account.
## API note

Calendar connect and booking tools are configured in the dashboard. The public API Reference focuses on agents, calls, and webhooks — use Connections → Bookings calendar for Google setup rather than low-level calendar REST.

## Next

[Agents & builder](/docs/agents) · [Meeting agents](/docs/meetings) · [Variables](/docs/variables) for guest name/email in prompts