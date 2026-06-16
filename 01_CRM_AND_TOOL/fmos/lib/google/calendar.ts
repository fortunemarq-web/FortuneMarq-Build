/**
 * Google Calendar + Meet integration — SERVER ONLY.
 *
 * Uses OAuth2 with a stored refresh token (GOOGLE_REFRESH_TOKEN).
 * All events are created on GOOGLE_CALENDAR_ID (default: "primary" = Jabeer's calendar).
 */

import { google } from "googleapis";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

const CALENDAR_ID = () => process.env.GOOGLE_CALENDAR_ID || "primary";

export interface CalendarEventResult {
  ok: boolean;
  eventId?: string;
  meetLink?: string;
  calendarLink?: string;
  startIso?: string;
  endIso?: string;
  error?: string;
}

/**
 * Create a Google Calendar event with a Meet link.
 * Duration defaults to 60 minutes.
 */
export async function createMeetingEvent(opts: {
  title: string;
  startIso: string;       // ISO 8601 — the meeting date/time
  durationMinutes?: number;
  description?: string;
  attendeeEmail?: string; // lead's email if known
  location?: string;
}): Promise<CalendarEventResult> {
  const auth = getOAuth2Client();
  if (!auth) {
    return { ok: false, error: "Google Calendar credentials not configured" };
  }

  const calendar = google.calendar({ version: "v3", auth });
  const start = new Date(opts.startIso);
  if (isNaN(start.getTime())) {
    return { ok: false, error: "Invalid startIso date" };
  }

  const end = new Date(start.getTime() + (opts.durationMinutes ?? 60) * 60 * 1000);

  const attendees = opts.attendeeEmail
    ? [{ email: opts.attendeeEmail }]
    : [];

  try {
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID(),
      conferenceDataVersion: 1,
      requestBody: {
        summary: opts.title,
        description: opts.description,
        location: opts.location,
        start: { dateTime: start.toISOString(), timeZone: "Asia/Kolkata" },
        end: { dateTime: end.toISOString(), timeZone: "Asia/Kolkata" },
        attendees,
        conferenceData: {
          createRequest: {
            requestId: `fmos-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: { useDefault: false, overrides: [] }, // FMOS sends its own reminders
      },
    });

    const event = res.data;
    const meetLink =
      event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ?? undefined;

    return {
      ok: true,
      eventId: event.id ?? undefined,
      meetLink,
      calendarLink: event.htmlLink ?? undefined,
      startIso: event.start?.dateTime ?? opts.startIso,
      endIso: event.end?.dateTime ?? end.toISOString(),
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[google/calendar] createMeetingEvent error:", msg);
    return { ok: false, error: msg };
  }
}

/**
 * Update an existing event's start/end time (reschedule).
 */
export async function rescheduleMeetingEvent(opts: {
  eventId: string;
  startIso: string;
  durationMinutes?: number;
}): Promise<CalendarEventResult> {
  const auth = getOAuth2Client();
  if (!auth) return { ok: false, error: "Google Calendar credentials not configured" };

  const calendar = google.calendar({ version: "v3", auth });
  const start = new Date(opts.startIso);
  if (isNaN(start.getTime())) return { ok: false, error: "Invalid startIso date" };
  const end = new Date(start.getTime() + (opts.durationMinutes ?? 60) * 60 * 1000);

  try {
    const res = await calendar.events.patch({
      calendarId: CALENDAR_ID(),
      eventId: opts.eventId,
      requestBody: {
        start: { dateTime: start.toISOString(), timeZone: "Asia/Kolkata" },
        end: { dateTime: end.toISOString(), timeZone: "Asia/Kolkata" },
      },
    });

    const event = res.data;
    const meetLink =
      event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ?? undefined;

    return {
      ok: true,
      eventId: event.id ?? undefined,
      meetLink,
      startIso: event.start?.dateTime ?? opts.startIso,
      endIso: event.end?.dateTime ?? end.toISOString(),
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Delete / cancel a calendar event (on no-show or cancellation).
 */
export async function cancelMeetingEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const auth = getOAuth2Client();
  if (!auth) return { ok: false, error: "Google Calendar credentials not configured" };

  const calendar = google.calendar({ version: "v3", auth });
  try {
    await calendar.events.delete({ calendarId: CALENDAR_ID(), eventId });
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
