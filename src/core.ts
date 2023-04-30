/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, User } from 'node-telegram-bot-api';
import { Attendee } from './models';
import { Event } from './models';
import { getEventDescription, getSerialEvent, shortenDescriptionIfTooLong, getDateOnCmd, getEventIdOnCmd, getCmdCreateEvent, getCmdUpdateEvent } from './stuff/cmd-helper';
/* eslint-disable */
const HTMLDecoderEncoder = require("html-encoder-decoder");

export function createEventDescription(message: Message, i18n: any): string {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  const event_date = displayDate(getDateEvent(message));
  return getEventDescription(message.text, event_date, i18n, false);
}

export function createSerialEvent(message: Message, removeId: boolean): string {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  return getSerialEvent(message.text, removeId);
}

export function getEventId(message: Message): number {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  return getEventIdOnCmd(message.text);
}

export function getDateEvent(message: Message): Date|null|undefined {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  return getDateOnCmd(message.text);
}

export function addEventAuthor(text: string, author: User, i18n: any): string {
  return `${text}\n\n<i>${i18n.message_content.created_by} ${mentionUser(getFullNameString(author), author.id)}</i>`;
}

function mentionUser(user_name: string, user_id: number|string): string {
  const user_link = `<a href="tg://user?id=${user_id}">${user_name}</a>`; 
  return user_link;
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

export function getUserId(user: User): number {
  if (user.id === undefined) {
    //throw new Error(`User doesn't have a username: ${user}`);
    return null;
  }
  return user.id;
}

export function getTelegramUserName(user: User): string {
  if (user.username === undefined) {
    //throw new Error(`User doesn't have a username: ${user}`);
    return '';
  }
  return user.username;
}

export function createEventIDFromMessage(message: Message): string {
  return `${message.chat.id}_${message.message_id}`;
}

export function getEventTextWithAttendees(description: string, when: Date|null, author_name: string, author_id: string, attendees: Attendee[], i18n: any): string {
  const event_date = displayDate(when);
  let user_name = author_id;
  user_name = user_name.length>0 ? ` (@${user_name})` : '';
  return `${getEventDescription(description, event_date, i18n, false)}\n\n<i>${i18n.message_content.created_by} ${mentionUser(author_name, author_id)}</i>\n\n<b>${attendees.length} ${i18n.message_content.rsvps} :</b>${attendees.reduce(
    (attendeesString, attendeeRow) =>
      `${attendeesString}\n - ${mentionUser(attendeeRow.user_name, attendeeRow.user_id)}`,
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
  return `${i18n.message_list_content.prefix} id=${event.id}\n(chat_id=${event.chat_id}), date=${displayDate(event.when)}, auteur=${mentionUser(event.author_name, event.author_id)}\n${event.description}` ;
}

export function cmdCreateEvent(event: Event): string {
  return getCmdCreateEvent(event);
}

export function cmdUpdateEvent(event: Event): string {
  return getCmdUpdateEvent(event);
}

export function displayHelp(i18n: any): string {
  return `${i18n.help.header}\n\n${i18n.help.event}\n\n${i18n.help.list}\n\n${i18n.help.help}`;
}

export function displayHelpAdmin(i18n: any): string {
  return `${displayHelp(i18n)}\n\n${i18n.help.listall}\n\n${i18n.help.date}\n\n${i18n.help.delete}\n\n${i18n.help.cmd}\n\n${i18n.help.update}`;
}

function listHeader(i18n: any): string {
  return `${i18n.message_list_content.header}`;
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
      `${eventsString}${i18n.message_list_content.prefix} (id=${eventsRow.id})\nchat_id=${eventsRow.chat_id}, date=${displayDate(eventsRow.when)}, auteur=${mentionUser(eventsRow.author_name, eventsRow.author_id)})\n${shortenDescriptionIfTooLong(eventsRow.description, 50, false)}\n${i18n.message_list_content.separator}\n`,
    '',
  )}`;
}

function displayDate(when: Date|undefined|null): string{
  if (when === undefined || when == null) return '<i>(Pas de date)</i>\n';
  return `${when.getDate()}/${when.getMonth()+1}/${when.getFullYear()}\n`;
}