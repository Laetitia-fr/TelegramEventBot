export interface Attendee {
  id: number;
  event_id: number;
  user_id: number;
  user_name: string;
  telegram_name: string;
}

export interface Event {
  id: number;
  chat_id: string;
  message_id: number;
  when: Date|null;
  description: string;
  author_name: string;
  author_id: string;
}

export enum Action {
  RSVP = 'RSVP',
  CANCEL_RSVP = 'CANCEL_RSVP',
}