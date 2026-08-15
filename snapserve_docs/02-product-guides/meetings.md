<!-- Source: https://app.snapserve.ai/docs/meetings -->

# Meeting agents

Send a SnapServe agent into Google Meet, Zoom, or Microsoft Teams — paste a link, auto-join calendar events, or dispatch from bookings.

## What meetings are

A **meeting agent** is the same agent brain as phone calls, running inside a video room via a Recall.ai bot. Configure a meeting prompt (and optional slide deck) on the agent, then join from [Meetings](https://app.snapserve.ai/app/meet) (`/app/meet`).

Meetings do not replace Campaigns. Campaigns dial phone leads; Meetings join a video URL that already exists.
## Enable on an agent

1. Open the agent in the Builder.
1. Turn on Meetings / Phone+meetings and set a **meeting prompt**.
1. Optional: bot display name, duration, silence timeout, mute-when-idle, presentation URL, auto-start slides, who joins (self vs delegate agent).
1. The agent appears on the Meetings page.

## Three join paths

| Path | Where | When |
| Paste link | `/app/meet` | Ad-hoc join now |
| Google Calendar (AI meetings) | `/app/meet` → Connect Google → Join toggles | Auto-join upcoming events |
| Booking auto-dispatch | Scheduling / bookings with a Meet link | Bot joins near the slot |

**Two Google Calendar connects.** Connections → Bookings calendar creates booking events (write). Meeting bots → Connect Google is readonly for AI meeting join. Do not treat them as the same button.
## In-meeting capabilities

When the agent is inside a meeting, these tools are available:

- `leave_meeting` — exit cleanly
- `mute_meeting` / `unmute_meeting`
- `send_meeting_chat` — optional pin
- `start_presentation`, `stop_presentation`, `next_slide`, `previous_slide`, `goto_slide`
- `schedule_meet_rejoin` — rejoin the same URL later

Hosts may need to **admit** the bot from the Meet waiting room.

## Meetings API

Session-authenticated endpoints are listed in the API Reference under **Meetings**:

- [POST /meet-bots](/docs/api-reference/createMeetBot) — launch
- [GET /meet-bots/{botId}](/docs/api-reference/getMeetBot) — status
- [DELETE /meet-bots/{botId}](/docs/api-reference/leaveMeetBot) — leave
- [GET /meet-bots/identity](/docs/api-reference/getMeetBotIdentity)
- [GET /meet-calendar/connection](/docs/api-reference/getMeetCalendarConnection)
- [GET /meet-calendar/events](/docs/api-reference/listMeetCalendarEvents)
- [POST /meet-calendar/events/{eventId}/bot](/docs/api-reference/enableMeetCalendarEventBot)
- [DELETE /meet-calendar/events/{eventId}/bot](/docs/api-reference/disableMeetCalendarEventBot)

## Related

- [Platform concepts](/docs/platform-concepts) — who owns what
- [Agents & builder](/docs/agents) — Outcomes & prompts
- [Bookings calendar](/docs/calendar) — booking write path
- [Campaigns](/docs/campaigns) — phone dialing at scale