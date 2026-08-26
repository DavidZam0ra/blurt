import { Component, input } from '@angular/core';
import { EventCategory } from '../../core/models/event-category';

@Component({
  selector: 'app-category-icon',
  template: `
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
      @switch (category()) {
        @case ('work') {
          <rect x="2" y="5.5" width="12" height="8" rx="1.2" stroke="currentColor" stroke-width="1.3" />
          <path
            d="M6 5.5V4.2A1.2 1.2 0 0 1 7.2 3h1.6A1.2 1.2 0 0 1 10 4.2V5.5"
            stroke="currentColor"
            stroke-width="1.3"
          />
        }
        @case ('food') {
          <path
            d="M5 2v4.3M6.5 2v4.3M5.75 6.3V14M9.5 2v5c0 1-.6 1.7-1.5 1.7v5.3"
            stroke="currentColor"
            stroke-width="1.1"
            stroke-linecap="round"
          />
        }
        @case ('health') {
          <path
            d="M8 13.6S2.6 10.2 2.6 6.6A3.1 3.1 0 0 1 8 4.4a3.1 3.1 0 0 1 5.4 2.2c0 3.6-5.4 7-5.4 7z"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        }
        @case ('personal') {
          <circle cx="8" cy="5.5" r="2.3" stroke="currentColor" stroke-width="1.3" />
          <path d="M3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
        }
        @case ('travel') {
          <path
            d="M2 8.5 13 3.5c.6-.3 1.1.3.8.9L9.5 13l-1-3.5-3.5-1L7 6.8 2 8.5Z"
            stroke="currentColor"
            stroke-width="1.1"
            stroke-linejoin="round"
          />
        }
        @default {
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2" />
        }
      }
    </svg>
  `,
})
export class CategoryIcon {
  readonly category = input.required<EventCategory>();
}
