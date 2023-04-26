import { Attendee, Event } from './models';
import { all, get, run } from './stuff/db-helper';
import { ENV } from './stuff/environment-variables';
/* eslint-disable */
const mysql = require('mysql2');

const DESCRIPTION_MAX_LENGTH = 4500;

export class DB {
  private connection: any;

  constructor() {
    this.connection = mysql.createConnection({
      host: ENV.DATABASE_HOST,
      port: ENV.DATABASE_PORT,
      user: ENV.DATABASE_USER,
      password: ENV.DATABASE_PWD,
      database: ENV.DATABASE_NAME,
    });
  }

  public async getAllEvents(): Promise<Event[]> {
    return await all<Event>(this.connection, 'SELECT id, chat_id, message_id, description FROM events');
  }

  public async getEventsOnChat(chat_id: number): Promise<Event[]> {
    return await all<Event>(this.connection, 'SELECT id, chat_id, message_id, `when`, description FROM events WHERE chat_id=? order by case when `when` is null then 9999/12/31 else `when` end asc', [chat_id]);
  }

  public async getEvent(chat_id: number, message_id: number): Promise<Event> {
    return await get<Event>(this.connection, 'SELECT id, chat_id, message_id, description FROM events WHERE chat_id=? AND message_id=?', [chat_id, message_id]);
  }

  public async insertEvent(chat_id: number, message_id: number, when: Date|null|undefined, description: string): Promise<void> {
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      throw new Error(`Description too long. Maximum length: ${DESCRIPTION_MAX_LENGTH} characters.`);
    }
    if (when === undefined || when == null){
      //console.log('date undefined');
      await run(this.connection, 'INSERT INTO events (chat_id, message_id, description) VALUES (?,?,?)', [chat_id, message_id, description]);
    } else {
      //console.log(`date ${when}`);
      await run(this.connection, 'INSERT INTO events (chat_id, message_id, `when`, description) VALUES (?,?,?,?)', [chat_id, message_id, when, description]);
    } 
}

  public async rsvpToEvent(event_id: number, user_id: number, name: string): Promise<void> {
    //console.log(`${event_id}, ${user_id}, ${name}`)
    await run(this.connection, 'INSERT INTO attendees (event_id, user_id, name) VALUES (?, ?, ?)', [event_id, user_id, name]);
  }

  public async removeRsvpFromEvent(event_id: number, user_id: number): Promise<void> {
    await run(this.connection, 'DELETE FROM attendees WHERE event_id=? AND user_id=?', [event_id, user_id]);
  }

  public async didThisUserRsvpAlready(chat_id: number, message_id: number, user_id: number): Promise<boolean> {
    const attendances = await this.getAttendeesForEventAndUser(chat_id, message_id, user_id);
    return attendances.length > 0;
  }

  private async getAttendeesForEventAndUser(chat_id: number, message_id: number, user_id: number): Promise<Attendee[]> {
    return await all<Attendee>(this.connection, 'SELECT attendees.* FROM attendees JOIN events ON attendees.event_id = events.id WHERE chat_id=? AND message_id=? AND user_id=?',
      [chat_id, message_id, user_id],
    );
  }

  public async getAttendeesForEvent(chat_id: number, message_id: number): Promise<Attendee[]> {
    return await all<Attendee>(this.connection, 'SELECT attendees.* FROM attendees JOIN events ON attendees.event_id = events.id WHERE chat_id=? AND message_id=?',
      [chat_id, message_id],
    );
  }
}
