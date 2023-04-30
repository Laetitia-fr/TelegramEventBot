/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import TelegramBot, { EditMessageTextOptions, Message, SendMessageOptions, PinChatMessageOptions, User } from 'node-telegram-bot-api';
import { InlineKeyboard, InlineKeyboardButton, Row } from 'node-telegram-keyboard-wrapper';
import { createEventDescription, addEventAuthor, getDateEvent, createSerialEvent, getEventTextWithAttendees
  , getFullNameString, getUserId, getTelegramUserName
  , createEventsList, createEventsListForAdmin, getEventId, displayEventForAdmin, cmdCreateEvent, cmdUpdateEvent
  , displayHelp, displayHelpAdmin } from './core';
import { DB } from './db';
import { Action, Event } from './models';

export async function createEvent(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  const event_date = getDateEvent(message);
  const event_description = createEventDescription(message, i18n);
  const event_description_with_author = addEventAuthor(event_description, message.from, i18n);
  const serial_event = createSerialEvent(message, false);
  deleteMessage(bot, message);
  if (message.text.trim().match(/^\/(E|e)vent(@[a-zA-Z0-9_]*|)$/) != null) {
    return;
  }
  const options: SendMessageOptions = {
    parse_mode: 'HTML',
    reply_markup: rsvpButtons(i18n.buttons.rsvp, i18n.buttons.cancel_rsvp).getMarkup(),
    disable_notification: true,
  };
  if (message.chat.is_forum) {
    options.message_thread_id=message.message_thread_id;
  }
  const created_message = await bot.sendMessage(message.chat.id, event_description_with_author, options);
  const pinOpts: PinChatMessageOptions = {
    disable_notification: true,
  };
  bot.pinChatMessage(created_message.chat.id, created_message.message_id, pinOpts);
  const author_name = getFullNameString(message.from);
  const author_id = getUserId(message.from);
  await db.insertEvent(created_message.chat.id, created_message.message_id, event_date, serial_event, author_name, author_id);
}

function rsvpButtons(rsvp_label: string, cancel_label: string) {
  const buttons = new InlineKeyboard();
  buttons.push(
    new Row(new InlineKeyboardButton(rsvp_label, 'callback_data', Action.RSVP)),
    new Row(new InlineKeyboardButton(cancel_label, 'callback_data', Action.CANCEL_RSVP)),
  );
  return buttons;
}

export async function changeEvent(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  const event_id = getEventId(message);
  if (event_id == 0) {
    await msgError(message, i18n.errors.id_not_found, i18n, db, bot);
    return;
  }
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  const serial_event = createSerialEvent(message, true);
  const event = await db.updateDescriptionOfEvent(event_id, serial_event);
  if (event === undefined) {
    await msgError(message, i18n.errors.id_not_found, i18n, db, bot);
    return;
  }

  await refreshMessageEvent(event, i18n, db, bot);

  const event_detail = displayEventForAdmin(event, i18n);
  const optionsS: SendMessageOptions = {
    parse_mode: 'HTML',
  };
  await bot.sendMessage(message.chat.id, event_detail, optionsS);
}

async function refreshMessageEvent(event: Event, i18n: any, db: DB, bot: TelegramBot) {
  const attendees = await db.getAttendeesForEvent(event.chat_id, event.message_id);
  const eventTextWithAttendees = getEventTextWithAttendees(event.description, event.when
    , event.author_name, event.author_id, attendees, i18n);
  const options: EditMessageTextOptions = {
    chat_id: event.chat_id,
    message_id: event.message_id,
    parse_mode: 'HTML',
    reply_markup: rsvpButtons(i18n.buttons.rsvp, i18n.buttons.cancel_rsvp).getMarkup(),
  };
  bot.editMessageText(eventTextWithAttendees, options);
}

function deleteMessage(bot: TelegramBot, message: Message): void {
  bot.deleteMessage(message.chat.id, message.message_id);
}

export async function changeRSVPForUser(
  message: Message | undefined,
  query_id: string,
  user: User,
  query_data: string | undefined,
  i18n: any,
  db: DB,
  bot: TelegramBot,
) {
  if (message === undefined) {
    throw new Error(`Tried to change RSVP-status, but 'message'-object is undefined.`);
  }
  if (query_data === undefined) {
    throw new Error(`Tried to change RSVP-status, but 'data' is undefined. Expected: 'RSVP' or 'CANCEL_RSVP'`);
  }
  const rsvpedAlready = await db.didThisUserRsvpAlready(message.chat.id.toString(), message.message_id, user.id);
  const cancellingRSVP = (query_data === Action.CANCEL_RSVP);
  if (
    (cancellingRSVP && !rsvpedAlready) ||
    (!cancellingRSVP && rsvpedAlready)
  ) {
    bot.answerCallbackQuery(query_id, { text: '' });
    return;
  }
  const chat_id = message.chat.id;
  const { message_id } = message;
  //console.log(`Chat: ${chat_id}, Message: ${message_id}`);
  const event = await db.getEvent(chat_id, message_id);
  //console.log(`Event: ${event.id}`);
  if (event === undefined) {
    bot.answerCallbackQuery(query_id, { text: '' }).then(async () => {
      console.log(`Event not found - Chat: ${chat_id}, Message: ${message_id} - ignore it`);
    });
    return;
    //throw new Error(`Event could not be found in the database: chat_id=${chat_id}, message_id=${message_id}`);
  }
  if (!cancellingRSVP) {
    await db.rsvpToEvent(event.id, user.id, getFullNameString(user), getTelegramUserName(user));
  } else {
    await db.removeRsvpFromEvent(event.id, user.id);
  }

  bot.answerCallbackQuery(query_id, { text: '' }).then(async () => {
    await refreshMessageEvent(event, i18n, db, bot);
  });
}

export async function listEvents(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  const events = await db.getEventsOnChat(message.chat.id);
  deleteMessage(bot, message);
  if (events.length > 0){
    const events_list = createEventsList(events, i18n);
    const options: SendMessageOptions = {
      parse_mode: 'HTML',
    };
    if (message.chat.is_forum) {
      options.message_thread_id=message.message_thread_id;
    }
    await bot.sendMessage(message.chat.id, events_list, options);
  }
}

export async function listAllEvents(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  const events = await db.getAllEvents();
  //deleteMessage(bot, message);
  if (events.length > 0){
    const events_list = createEventsListForAdmin(events, i18n);
    const options: SendMessageOptions = {
      parse_mode: 'HTML',
    };
    if (message.chat.is_forum) {
      options.message_thread_id=message.message_thread_id;
    }
    await bot.sendMessage(message.chat.id, events_list, options);
  }
}

export async function msgError(message: Message, response: string, i18n: any, db: DB, bot: TelegramBot) {
  //deleteMessage(bot, message);
  const options: SendMessageOptions = {
    parse_mode: 'HTML',
  };
  if (message.chat.is_forum) {
    options.message_thread_id=message.message_thread_id;
  }
  await bot.sendMessage(message.chat.id, response, options);
}

export async function dateEvent(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  const event_id = getEventId(message);
  if (event_id == 0) {
    await msgError(message, i18n.errors.id_not_found, i18n, db, bot);
    return;
  }
  const event_date = getDateEvent(message);
  if (event_date === undefined || event_date == null) {
    await msgError(message, i18n.errors.date_not_found, i18n, db, bot);
    return;
  }
  const event = await db.updateDateOfEvent(event_id, event_date);
  if (event === undefined || event == null) {
    await msgError(message, i18n.errors.id_not_found, i18n, db, bot);
    return;
  }
  
  await refreshMessageEvent(event, i18n, db, bot);

  const event_detail = displayEventForAdmin(event, i18n);
  const options: SendMessageOptions = {
    parse_mode: 'HTML',
  };
  await bot.sendMessage(message.chat.id, event_detail, options);
}

export async function deleteEvent(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  const event_id = await sendEvent(message, i18n, db, bot, true);
  await db.deleteEvent(event_id);
}

export async function cmdEvent(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  await sendEvent(message, i18n, db, bot, false);
}

async function sendEvent(message: Message, i18n: any, db: DB, bot: TelegramBot, createMsg: boolean): Promise<number> {
  const event_id = getEventId(message);
  if (event_id == 0) {
    await msgError(message, i18n.errors.id_not_found, i18n, db, bot);
    return;
  }
  const event = await db.getEventById(event_id);
  if (event === undefined || event == null) {
    await msgError(message, i18n.errors.id_not_found, i18n, db, bot);
    return;
  }
  const event_detail = createMsg ? cmdCreateEvent(event) : cmdUpdateEvent(event);
  const options: SendMessageOptions = {
    parse_mode: 'HTML',
  };
  await bot.sendMessage(message.chat.id, event_detail, options);
  return event_id;
}

export async function help(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  deleteMessage(bot, message);
  const options: SendMessageOptions = {
    parse_mode: 'HTML',
  };
  await bot.sendMessage(message.chat.id, displayHelp(i18n), options);
}

export async function helpAdmin(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  deleteMessage(bot, message);
  const options: SendMessageOptions = {
    parse_mode: 'HTML',
  };
  await bot.sendMessage(message.chat.id, displayHelpAdmin(i18n), options);
}
