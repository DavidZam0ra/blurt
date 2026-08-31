import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { EventExtractionPort } from '../domain/event-extraction.port';
import { ExtractedEvent } from '../domain/extracted-event';
import { EVENT_CATEGORIES, EventCategory } from '../domain/event-category';
import { EventRecurrence, RECURRENCE_FREQUENCIES } from '../domain/event-recurrence';

const LLAMA_MODEL = 'openai/gpt-oss-120b';
const EXTRACT_EVENTS_TOOL_NAME = 'extract_calendar_events';

const EXTRACT_EVENTS_TOOL: Groq.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: EXTRACT_EVENTS_TOOL_NAME,
    description:
      'Extract one or more calendar events mentioned in a spoken transcript.',
    parameters: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description:
                  'Short title for the event that keeps the specific activity the speaker named, not just its topic ' +
                  '(e.g. "Tráiler de GTA 6", not just "GTA 6"; "Cena con Marta", not just "Marta"). ' +
                  'Do not drop the verb or activity word when summarizing.',
              },
              startDateTime: {
                type: 'string',
                description:
                  'Local wall-clock date-time when the event starts, in the format YYYY-MM-DDTHH:mm:ss ' +
                  '(no timezone offset, no "Z" suffix) — the time as the speaker would read it on their own clock, ' +
                  'resolved against the reference date-time.',
              },
              durationInMinutes: {
                type: 'number',
                description:
                  'How long the event lasts, in minutes, ONLY when the speaker explicitly states a duration ' +
                  '(e.g. "durante 2 horas" -> 120, "de una hora" -> 60, "30 minutos" -> 30). Omit entirely when no ' +
                  'duration is stated — do not guess one.',
              },
              endDate: {
                type: 'string',
                description:
                  'ONLY set when the speaker gives a date range with NO time of day (e.g. "del 24 al 27", "from the 3rd ' +
                  'to the 10th", "Viaje a Andorra del 24 al 27"). The LAST inclusive local date of the range, format ' +
                  'YYYY-MM-DD. When set, startDateTime should use the range\'s FIRST date at time 00:00:00, and the ' +
                  'event is treated as a single multi-day all-day event spanning both dates — never as a recurrence. ' +
                  'Omit entirely for anything with a specific time of day, or for a single-day event.',
              },
              isAmbiguous: {
                type: 'boolean',
                description:
                  'True when the spoken time reference has more than one reasonable interpretation given the reference date-time.',
              },
              category: {
                type: 'string',
                enum: EVENT_CATEGORIES as unknown as string[],
                description:
                  'Best-fit category for the event. Use "uncategorized" if none clearly applies.',
              },
              recurrence: {
                type: 'object',
                description:
                  'Only set when the speaker describes a repeating event (e.g. "todos los lunes", ' +
                  '"cada semana", "every day"). Omit entirely for one-off events.',
                properties: {
                  frequency: {
                    type: 'string',
                    enum: RECURRENCE_FREQUENCIES as unknown as string[],
                    description: 'How often the event repeats.',
                  },
                  interval: {
                    type: 'number',
                    description:
                      'Repeat every N units (e.g. "cada dos semanas" -> frequency weekly, interval 2). Omit if not stated — defaults to 1.',
                  },
                  byDayOfWeek: {
                    type: 'array',
                    items: { type: 'number' },
                    description:
                      'Only for weekly recurrence with specific weekdays (e.g. "los lunes y miércoles" -> [1,3]). 0=Sunday..6=Saturday. Omit otherwise.',
                  },
                  count: {
                    type: 'number',
                    description:
                      'Number of occurrences, only when the speaker gives a bounded count (e.g. "las próximas 4 semanas" -> 4). Do not set together with "until".',
                  },
                  until: {
                    type: 'string',
                    description:
                      'Last local wall-clock date-time the series should run until, same format as startDateTime, only when the speaker gives an explicit end date. Do not set together with "count".',
                  },
                },
                required: ['frequency'],
              },
            },
            required: ['title', 'startDateTime', 'isAmbiguous', 'category'],
          },
        },
      },
      required: ['events'],
    },
  },
};

interface ExtractedRecurrenceArguments {
  frequency: EventRecurrence['frequency'];
  interval?: number;
  byDayOfWeek?: number[];
  count?: number;
  until?: string;
}

interface ExtractedEventArguments {
  events: Array<{
    title: string;
    startDateTime: string;
    durationInMinutes?: number;
    endDate?: string;
    isAmbiguous: boolean;
    category: EventCategory;
    recurrence?: ExtractedRecurrenceArguments;
  }>;
}

interface DateTimeParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

function getDateTimeParts(date: Date, timeZone: string): DateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return parts as unknown as DateTimeParts;
}

function formatLocalReferenceDateTime(
  referenceDateTime: Date,
  timeZone: string,
): string {
  const { year, month, day, hour, minute, second } = getDateTimeParts(
    referenceDateTime,
    timeZone,
  );
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  }).format(referenceDateTime);
  return `${weekday}, ${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

function getTimeZoneOffsetInMinutes(timeZone: string, date: Date): number {
  const { year, month, day, hour, minute, second } = getDateTimeParts(
    date,
    timeZone,
  );
  const asUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return (asUtc - date.getTime()) / 60000;
}

function localWallClockToUtcIso(
  localDateTime: string,
  timeZone: string,
): string {
  const [datePart, timePart] = localDateTime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = (timePart ?? '00:00:00')
    .split(':')
    .map((value) => Number(value) || 0);
  const naiveUtcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetInMinutes = getTimeZoneOffsetInMinutes(
    timeZone,
    new Date(naiveUtcGuess),
  );
  return new Date(naiveUtcGuess - offsetInMinutes * 60000).toISOString();
}

@Injectable()
export class GroqEventExtractionAdapter implements EventExtractionPort {
  private readonly logger = new Logger(GroqEventExtractionAdapter.name);
  private readonly client: Groq;

  constructor(configService: ConfigService) {
    this.client = new Groq({
      apiKey: configService.getOrThrow<string>('GROQ_API_KEY'),
    });
  }

  async extract(
    transcript: string,
    referenceDateTime: Date,
    timeZone: string,
    defaultReminderOffsetsInMinutes: number[],
  ): Promise<ExtractedEvent[]> {
    const localReferenceDateTime = formatLocalReferenceDateTime(
      referenceDateTime,
      timeZone,
    );

    let completion: Groq.Chat.Completions.ChatCompletion;
    try {
      completion = await this.client.chat.completions.create({
        model: LLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You extract calendar events from spoken transcripts. ' +
              `The reference date-time, in the speaker's local timezone (${timeZone}), is ${localReferenceDateTime} ` +
              "— this is when the speaker said these words, expressed on the speaker's own wall clock. " +
              'Resolve every relative date or time expression (e.g. "next Saturday", "tomorrow", "in two hours") against this local time, ' +
              'and always return startDateTime as a local wall-clock time in the same timezone — never convert it to UTC yourself. ' +
              'A transcript may mention multiple events; extract each one separately. ' +
              'Mark isAmbiguous true whenever a time expression could reasonably resolve to more than one date, or when an hour is given ' +
              'without saying whether it is morning, afternoon, or night (e.g. "a las nueve" without further context). ' +
              `Assign each event a category from: ${EVENT_CATEGORIES.join(', ')}. ` +
              'Only set "recurrence" when the speaker explicitly describes a repeating event ("todos los lunes", "cada semana", ' +
              '"every day", weekday lists like "lunes y miércoles"), OR gives a date range ("desde el 1 hasta el 15 de septiembre", ' +
              '"from the 3rd to the 10th") together with a specific time of day — treat that as a daily recurrence at that time, ' +
              'running from the range\'s first date to its last date. Do not infer recurrence from a single one-off mention. A bare ' +
              'date range with NO time of day (e.g. "Viaje a Andorra del 24 al 27") is never recurrence — set "endDate" instead ' +
              '(see its own field description) to make it a multi-day all-day event. ' +
              'Leave "interval" unset unless a multiplier is stated ("cada dos semanas"). Only set "count" or "until" — never both — ' +
              'when the speaker gives an explicit end for the series (a date range\'s last date becomes "until"); leave both unset for an ' +
              'open-ended recurrence. ' +
              'Common time-of-day words: "mediodía"/"noon" = 12:00, "medianoche"/"midnight" = 00:00, and "madrugada" means the small ' +
              'hours (roughly 00:00-06:00) even when only a bare number is given (e.g. "las 3 de la madrugada" = 03:00, not 15:00). ' +
              'Hedges like "sobre las", "a eso de", "hacia las", "más o menos a las" still resolve to the exact hour stated — they do not ' +
              'by themselves make isAmbiguous true. Common relative-date phrases: "pasado mañana" = the day after tomorrow; ' +
              '"en/dentro de N días/semanas/meses" = N units after the reference date; "el/la próximo(a) [weekday]" and "esta/este [weekday]" ' +
              'both mean the next upcoming occurrence of that weekday (today itself if the reference date-time already falls on it and the ' +
              'stated time hasn\'t passed yet). "el finde"/"este finde"/"fin de semana" defaults to the coming Saturday when no specific day ' +
              'is said — mark isAmbiguous true for it, since it could mean either Saturday or Sunday. ' +
              'Use these category hints loosely, not as a strict list: comida/cena/desayuno/brunch/café -> food; ' +
              'gimnasio/entreno/médico/dentista/fisio/consulta -> health; curro/oficina/reunión/junta/presentación/cliente -> work; ' +
              'cumpleaños/cumple/boda/quedada/peli -> personal; vuelo/tren/viaje/hotel/maleta -> travel. ' +
              'Set "durationInMinutes" only when the speaker explicitly states how long the event lasts ' +
              '("durante 2 horas", "de una hora", "30 minutos") — never infer or guess a duration.',
          },
          { role: 'user', content: transcript },
        ],
        tools: [EXTRACT_EVENTS_TOOL],
        tool_choice: {
          type: 'function',
          function: { name: EXTRACT_EVENTS_TOOL_NAME },
        },
      });
    } catch (error) {
      if (error instanceof Groq.APIError && error.status === 400) {
        this.logger.warn(
          `extract() -> Groq could not extract a tool call from transcript "${transcript}", treating as no events`,
        );
        return [];
      }
      throw error;
    }

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      return [];
    }

    const { events } = JSON.parse(
      toolCall.function.arguments,
    ) as ExtractedEventArguments;
    return events.map((event) => ({
      title: event.title,
      startDateTime: localWallClockToUtcIso(event.startDateTime, timeZone),
      durationInMinutes: event.durationInMinutes,
      // Plain local calendar date, deliberately left unconverted (no TZ math) —
      // Google Calendar's all-day date fields are date-only, not an instant.
      endDate: event.endDate,
      isAmbiguous: event.isAmbiguous,
      category: event.category,
      reminderOffsetsInMinutes: defaultReminderOffsetsInMinutes,
      timeZone,
      recurrence: event.recurrence
        ? toEventRecurrence(event.recurrence, timeZone)
        : undefined,
    }));
  }
}

function toEventRecurrence(
  raw: ExtractedRecurrenceArguments,
  timeZone: string,
): EventRecurrence {
  const recurrence: EventRecurrence = { frequency: raw.frequency };
  if (raw.interval) {
    recurrence.interval = raw.interval;
  }
  if (raw.byDayOfWeek?.length) {
    recurrence.byDayOfWeek = raw.byDayOfWeek;
  }
  // The model is told never to set both — count wins if it slips through anyway.
  if (raw.count) {
    recurrence.count = raw.count;
  } else if (raw.until) {
    recurrence.until = localWallClockToUtcIso(raw.until, timeZone);
  }
  return recurrence;
}
