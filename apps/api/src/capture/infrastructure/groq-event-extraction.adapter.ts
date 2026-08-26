import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { EventExtractionPort } from '../domain/event-extraction.port';
import { ExtractedEvent } from '../domain/extracted-event';
import { EVENT_CATEGORIES, EventCategory } from '../domain/event-category';

const LLAMA_MODEL = 'llama-3.3-70b-versatile';
const EXTRACT_EVENTS_TOOL_NAME = 'extract_calendar_events';
const DEFAULT_REMINDER_OFFSETS_IN_MINUTES = [24 * 60, 60];

const EXTRACT_EVENTS_TOOL: Groq.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: EXTRACT_EVENTS_TOOL_NAME,
    description: 'Extract one or more calendar events mentioned in a spoken transcript.',
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
                description: 'Short human-readable title for the event.',
              },
              startDateTime: {
                type: 'string',
                description: 'ISO 8601 date-time when the event starts, resolved against the reference date-time.',
              },
              isAmbiguous: {
                type: 'boolean',
                description:
                  'True when the spoken time reference has more than one reasonable interpretation given the reference date-time.',
              },
              category: {
                type: 'string',
                enum: EVENT_CATEGORIES as unknown as string[],
                description: 'Best-fit category for the event. Use "uncategorized" if none clearly applies.',
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
  events: Array<{ title: string; startDateTime: string; isAmbiguous: boolean; category: EventCategory }>;
}

@Injectable()
export class GroqEventExtractionAdapter implements EventExtractionPort {
  private readonly client: Groq;

  constructor(configService: ConfigService) {
    this.client = new Groq({ apiKey: configService.getOrThrow<string>('GROQ_API_KEY') });
  }

  async extract(transcript: string, referenceDateTime: Date): Promise<ExtractedEvent[]> {
    const completion = await this.client.chat.completions.create({
      model: LLAMA_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You extract calendar events from spoken transcripts. ' +
            `The reference date-time is ${referenceDateTime.toISOString()} — this is when the speaker said these words, ` +
            'so resolve every relative date or time expression (e.g. "next Saturday", "tomorrow", "in two hours") against it. ' +
            'A transcript may mention multiple events; extract each one separately. ' +
            'Mark isAmbiguous true whenever a time expression could reasonably resolve to more than one date or time. ' +
            `Assign each event a category from: ${EVENT_CATEGORIES.join(', ')}.`,
        },
        { role: 'user', content: transcript },
      ],
      tools: [EXTRACT_EVENTS_TOOL],
      tool_choice: { type: 'function', function: { name: EXTRACT_EVENTS_TOOL_NAME } },
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      return [];
    }

    const { events } = JSON.parse(toolCall.function.arguments) as ExtractedEventArguments;
    return events.map((event) => ({
      title: event.title,
      startDateTime: event.startDateTime,
      isAmbiguous: event.isAmbiguous,
      category: event.category,
      reminderOffsetsInMinutes: DEFAULT_REMINDER_OFFSETS_IN_MINUTES,
    }));
  }
}
