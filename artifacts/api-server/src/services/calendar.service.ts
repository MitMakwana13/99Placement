import * as ics from "ics";
import { logger } from "../config/logger";
import crypto from "crypto";

export class CalendarService {
  /**
   * Generates a mock Google Meet or Zoom meeting link.
   */
  static generateMeetingLink(platform: "Google Meet" | "Zoom" | "Teams" = "Google Meet"): string {
    const id = crypto.randomBytes(4).toString("hex");
    if (platform === "Google Meet") return `https://meet.google.com/xyz-${id}-abc`;
    if (platform === "Zoom") return `https://zoom.us/j/${crypto.randomInt(1000000000, 9999999999)}?pwd=${crypto.randomBytes(4).toString("hex")}`;
    if (platform === "Teams") return `https://teams.microsoft.com/l/meetup-join/19:meeting_${id}`;
    return `https://meet.google.com/xyz-${id}-abc`;
  }

  /**
   * Generates an .ics file content as a string
   */
  static generateICS(eventDetails: {
    title: string;
    description: string;
    location: string;
    start: Date;
    durationMinutes: number;
    organizerName: string;
    organizerEmail: string;
    attendees: { name: string; email: string }[];
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const start = eventDetails.start;
      const startArray: ics.DateArray = [
        start.getUTCFullYear(),
        start.getUTCMonth() + 1,
        start.getUTCDate(),
        start.getUTCHours(),
        start.getUTCMinutes(),
      ];

      const event: ics.EventAttributes = {
        start: startArray,
        startInputType: "utc",
        startOutputType: "utc",
        duration: { minutes: eventDetails.durationMinutes },
        title: eventDetails.title,
        description: eventDetails.description,
        location: eventDetails.location,
        url: eventDetails.location.startsWith("http") ? eventDetails.location : undefined,
        status: "CONFIRMED",
        organizer: { name: eventDetails.organizerName, email: eventDetails.organizerEmail },
        attendees: eventDetails.attendees.map(a => ({
          name: a.name,
          email: a.email,
          rsvp: true,
          partstat: "NEEDS-ACTION",
          role: "REQ-PARTICIPANT"
        }))
      };

      ics.createEvent(event, (error, value) => {
        if (error) {
          logger.error({ error }, "Failed to generate ICS file");
          return reject(error);
        }
        resolve(value);
      });
    });
  }
}
