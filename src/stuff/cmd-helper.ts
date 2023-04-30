import { Event } from '../models';
/* eslint-disable */
const HTMLDecoderEncoder = require("html-encoder-decoder");

function removeBotCommandWithoutID(text: string): string {
return text.replace(/^\/((E|e)vent(@[a-zA-Z0-9_]*|)|(D|d)ate|(C|c)md|(D|d)elete|(U|u)pdate)( |\n)?/, '');
}

function removeBotCommandWithID(text: string): string {
return text.replace(/^\/((D|d)ate|(C|c)md|(D|d)elete|(U|u)pdate) [0-9]*( |\n)?/, '');
}

function removeBotCommand(text: string, removeId: boolean): string {
return removeId ? removeBotCommandWithID(text) : removeBotCommandWithoutID(text);
}

export function shortenDescriptionIfTooLong(description: string, size: number, pretty: boolean): string {
  const descrip_without_balises = description.replace(/<[/]?[a-zA-Z]*>/g, '').replace(/\n/g, ' ');
  if (descrip_without_balises.length > size) {
    return descrip_without_balises.substring(0, size-4) + '...';
  } else {
    return pretty ? description : descrip_without_balises;
  }
}

export function getEventDescription(message: string, when: string, i18n: any, removeId: boolean): string {
  return displayEvent( getSerialEvent(message, removeId), when, i18n );
}

export function getSerialEvent(message: string, removeId: boolean): string {
  const event_description = removeBotCommand(message, removeId);
  const event_description_valid_length = shortenDescriptionIfTooLong(event_description, 3500, true);
  return event_description_valid_length;
}

function displayEvent(description: string, when: string, i18n: any): string {
  const event_description = `${i18n.message_content.prefix} ${when}\n\n${description}`;
  return event_description;
}

export function getDateOnCmd(message: string): Date|null|undefined {
  const event_description = removeBotCommand(message, true);
  const dates = event_description.matchAll(/(?<day>[0-9]{1,2})\/(?<month>[0-9]{1,2})(\/(?<year>[0-9]{2,4})|)/g);
  let result: Date|null = null;
  let dateFound = false;
  let currentDate = dates.next();
  const now = new Date();
  while (!dateFound && !currentDate.done) {
    if (currentDate.value.groups === undefined) {
      throw new Error(`Tried to extrtact date on message. Message: ${event_description}`);
    }
    const {year, month, day} = currentDate.value.groups;
    let yearRight = (year == null || year.length==0) ? now.getFullYear().toString() : year;
    yearRight = yearRight.length<=2 ? '2'+year.padStart(3, '0') : yearRight;
    result = new Date(`${yearRight}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
    if (! (result instanceof Date && isFinite(result.getTime())) ){
    result = null;
    } else {
    while ((year == null || year.length<4) && result < now){
        result.setFullYear(result.getFullYear()+1);
    }
    }
    dateFound = (result != null);
    currentDate = dates.next();
  }
  return result;
}

export function getEventIdOnCmd(message: string): number {
  const msg = removeBotCommandWithoutID(message);
  const ids = msg.match(/(?<id>[0-9]*)/);
  if (ids === undefined || ids?.groups == undefined){
    return 0;
  }
  return parseInt(ids?.groups?.id);
}

export function getCmdCreateEvent(event: Event): string {
  return `/event ${HTMLDecoderEncoder.encode(event.description)}` ;
}

export function getCmdUpdateEvent(event: Event): string {
  return `/update ${event.id} ${HTMLDecoderEncoder.encode(event.description)}` ;
}