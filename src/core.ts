/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, User } from 'node-telegram-bot-api';
import { Attendee } from './models';
import { Event } from './models';

export function createEventDescription(message: Message, i18n: any): string {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  const event_description = displayEvent( removeBotCommand(message.text), i18n );
  const event_description_valid_length = shortenDescriptionIfTooLong(event_description, 3500, true);
  return event_description_valid_length;
}

export function createSerialEvent(message: Message): string {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  const event_description = removeBotCommand(message.text);
  const event_description_valid_length = shortenDescriptionIfTooLong(event_description, 3500, true);
  return event_description_valid_length;
}

export function displayEvent(description: string, i18n: any): string {
  const event_description = '<u>' + i18n.message_content.prefix + '</u>\n\n' + description;
  return event_description;
}

function shortenDescriptionIfTooLong(description: string, size: number, pretty: boolean): string {
  const descrip_without_balises = description.replace(/<[/]?[a-zA-Z]*>/g, '').replace(/\n/g, ' ');
  if (descrip_without_balises.length > size) {
    return descrip_without_balises.substring(0, size-1) + '...';
  } else {
    return pretty ? description : descrip_without_balises;
  }
}

function removeBotCommand(text: string): string {
  return text.replace(/^\/((E|e)vent|(D|d)ate)( |\n)?/, '');
}

export function getDateEvent(message: Message): Date|null|undefined {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  const event_description = removeBotCommand(message.text);
  const dates = event_description.matchAll(/(?<day>[0-9]{1,2})\/(?<month>[0-9]{1,2})\/(?<year>[0-9]{4})/g);
  //console.log(dates);
  let yearI, monthI, dayI : number;
  let result: Date|null = null;
  for(const currentDate of dates) {
    if (currentDate.groups === undefined) {
      throw new Error(`Tried to extrtact date on message. Message: ${event_description}`);
    }
    const {year, month, day} = currentDate.groups;
    //console.log(`${year}-${month}-${day}`);
    yearI = parseInt(year);
    monthI = parseInt(month)-1;
    dayI = parseInt(day);
    if (yearI>=2023 && monthI>=0 && monthI<12 && dayI>0 && dayI<=31){
      result = new Date();
      result.setFullYear(yearI, monthI, dayI);
      if (! (result instanceof Date && isFinite(result.getTime())) ){
        result = null;
      }
    }
  }
  return result;
}

export function getEventId(message: Message): number {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  const msg = removeBotCommand(message.text);
  const ids = msg.match(/(?<id>[0-9]*)/);
  if (ids === undefined || ids?.groups == undefined){
    return 0;
  }
  return parseInt(ids?.groups?.id);
}

export function addEventAuthor(text: string, author: User, i18n: any): string {
  return `${text}\n\n<i>${i18n.message_content.created_by} ${getFullNameString(author)}</i>`;
}

export function getFullNameString(user: User): string {
  if (!user.first_name && !user.last_name) {
    if (user.username === undefined) {
      throw new Error(`User doesn't have a first_name, last_name or username: ${user}`);
    }
    return user.username;
  }
  if (user.last_name === undefined) {
    return user.first_name;
  }
  return `${user.first_name} ${user.last_name}`;
}

export function getAuthorId(user: User): string {
  if (user.username === undefined) {
    throw new Error(`User doesn't have a username: ${user}`);
  }
  return user.username;
}

export function createEventIDFromMessage(message: Message): string {
  return `${message.chat.id}_${message.message_id}`;
}

export function getEventTextWithAttendees(description: string, author_name: string, attendees: Attendee[], i18n: any): string {
  return `${displayEvent(description, i18n)}\n\n<i>${i18n.message_content.created_by} ${author_name}</i>\n\n<b>${attendees.length} ${i18n.message_content.rsvps} :</b>${attendees.reduce(
    (attendeesString, attendeeRow) =>
      `${attendeesString}\n - ${attendeeRow.name}`,
    '',
  )}`;
}

export function createEventsList(events: Event[], i18n: any): string {
  const events_header = listHeader(i18n);
  const events_content = addList(events_header, events, i18n);
  return events_content;
}

export function createEventsListForAdmin(events: Event[], i18n: any): string {
  const events_header = listHeader(i18n);
  const events_content = addTechnicalList(events_header, events, i18n);
  return events_content;
}

export function displayEventForAdmin(event: Event, i18n: any): string {
  return `${i18n.message_list_content.prefix} id=${event.id}\n(chat_id=${event.chat_id}), date=${displayDate(event.when)}, auteur=${event.author_name}(@${event.author_id})\n${event.description}` ;
}

function listHeader(i18n: any): string {
  return `<u>${i18n.message_list_content.header}</u>`;
}

function addList(text: string, events: Event[], i18n: any): string {
  return `${text}\n\n${events.reduce(
    (eventsString, eventsRow) =>
      `${eventsString}${i18n.message_list_content.prefix}${displayDate(eventsRow.when)}${shortenDescriptionIfTooLong(eventsRow.description, 200, true)}\n${i18n.message_list_content.separator}\n`,
    '',
  )}`;
}

function addTechnicalList(text: string, events: Event[], i18n: any): string {
  return `${text}\n\n${events.reduce(
    (eventsString, eventsRow) =>
      `${eventsString}${i18n.message_list_content.prefix} (id=${eventsRow.id})\nchat_id=${eventsRow.chat_id}, date=${displayDate(eventsRow.when)}, auteur=${eventsRow.author_name}(@${eventsRow.author_id})\n${shortenDescriptionIfTooLong(eventsRow.description, 50, false)}\n${i18n.message_list_content.separator}\n`,
    '',
  )}`;
}

function displayDate(when: Date|undefined|null): string{
  if (when === undefined || when == null) return '<i>(Pas de date)</i>\n';
  return `${when.getDate()}/${when.getMonth()+1}/${when.getFullYear()}\n`;
}