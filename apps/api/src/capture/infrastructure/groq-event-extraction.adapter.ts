import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { EventExtractionPort } from '../domain/event-extraction.port';
import { ExtractedEvent } from '../domain/extracted-event';
import { EVENT_CATEGORIES, EventCategory } from '../domain/event-category';

const LLAMA_MODEL = 'openai/gpt-oss-120b';
const EXTRACT_EVENTS_TOOL_NAME = 'extract_calendar_events';
const DEFAULT_REMINDER_OFFSETS_IN_MINUTES = [24 * 60, 60];

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
            },
            required: ['title', 'startDateTime', 'isAmbiguous', 'category'],
          },
        },
      },
      required: ['events'],
    },
  },
};

interface ExtractedEventArguments {
  events: Array<{
    title: string;
    startDateTime: string;
    isAmbiguous: boolean;
    category: EventCategory;
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
              `Assign each event a category from: ${EVENT_CATEGORIES.join(', ')}.`,
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
      isAmbiguous: event.isAmbiguous,
      category: event.category,
      reminderOffsetsInMinutes: DEFAULT_REMINDER_OFFSETS_IN_MINUTES,
    }));
  }
}
