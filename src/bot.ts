
import TelegramBot, { CallbackQuery, Message } from 'node-telegram-bot-api';
import packageInfo from '../package.json';
import { DB } from './db';
import { i18n } from './stuff/i18n';
import { ENV } from './stuff/environment-variables';
import { changeRSVPForUser, createEvent, changeEvent, listEvents, msgError, listAllEvents, dateEvent, deleteEvent, cmdEvent, help, helpAdmin } from './usecases';
import { pretty } from './stuff/pretty';

const db = new DB();

export const bot = new TelegramBot(ENV.BOT_TOKEN, { polling: true });
console.log(`Bot server started. Version ${packageInfo.version}. Production mode: ${ENV.PRODUCTION_MODE}`);

bot.onText(/^\/(E|e)vent.*/, async (message: Message) => {
  try {
    if (message.from?.is_bot){
      console.error(`Bot message. Command: ${pretty(message)}`);
      return;
    }
    await createEvent(message, i18n, db, bot);
  } catch (error) {
    console.error(`Error while creating event. Error: ${error}. Command: ${pretty(message)}`);
  }
});

bot.onText(/^\/(U|u)pdate.*/, async (message: Message) => {
  try {
    if (message.from?.is_bot){
      console.error(`Bot message. Command: ${pretty(message)}`);
      return;
    }
    await changeEvent(message, i18n, db, bot);
  } catch (error) {
    console.error(`Error while updating event. Error: ${error}. Command: ${pretty(message)}`);
  }
});

bot.on('callback_query', (query: CallbackQuery) => {
  try {
    changeRSVPForUser(query.message, query.id, query.from, query.data, i18n, db, bot);
  } catch (error) {
    console.error(`Error while creating event. Error: ${error}. Command: ${pretty(query)}`);
  }
});

bot.onText(/^\/(L|l)ist( .*|@.*|$)/, async (message: Message) => {
  try {
    if (message.from?.is_bot){
      console.error(`Bot message. Command: ${pretty(message)}`);
      return;
    }
    await listEvents(message, i18n, db, bot);
  } catch (error) {
    console.error(`Error while listing events. Error: ${error}. Command: ${pretty(message)}`);
  }
});

bot.onText(/^\/(L|l)istall( .*|$)/, async (message: Message) => {
  try {
    if (message.from?.is_bot){
      console.error(`Bot message. Command: ${pretty(message)}`);
      return;
    }
    if (fromAdmins(message)) {
      await listAllEvents(message, i18n, db, bot);
    } else {
      await msgError(message, i18n.errors.not_alow, i18n, db, bot);
    }
  } catch (error) {
    console.error(`Error while listing events. Error: ${error}. Command: ${pretty(message)}`);
  }
});

bot.onText(/^\/(D|d)ate .*/, async (message: Message) => {
  try {
    if (message.from?.is_bot){
      console.error(`Bot message. Command: ${pretty(message)}`);
      return;
    }
    if (fromAdmins(message)) {
      await dateEvent(message, i18n, db, bot);
    } else {
      await msgError(message, i18n.errors.not_alow, i18n, db, bot);
    }
  } catch (error) {
    console.error(`Error while dating event. Error: ${error}. Command: ${pretty(message)}`);
  }
});

bot.onText(/^\/(D|d)elete .*/, async (message: Message) => {
  try {
    if (message.from?.is_bot){
      console.error(`Bot message. Command: ${pretty(message)}`);
      return;
    }
    if (fromAdmins(message)) {
      await deleteEvent(message, i18n, db, bot);
    } else {
      await msgError(message, i18n.errors.not_alow, i18n, db, bot);
    }
  } catch (error) {
    console.error(`Error while removing event. Error: ${error}. Command: ${pretty(message)}`);
  }
});

bot.onText(/^\/(C|c)md .*/, async (message: Message) => {
  try {
    if (message.from?.is_bot){
      console.error(`Bot message. Command: ${pretty(message)}`);
      return;
    }
    if (fromAdmins(message)) {
      await cmdEvent(message, i18n, db, bot);
    } else {
      await msgError(message, i18n.errors.not_alow, i18n, db, bot);
    }
  } catch (error) {
    console.error(`Error while creating event command. Error: ${error}. Command: ${pretty(message)}`);
  }
});

function fromAdmins(message: Message): boolean {
  const telegram_admins = new RegExp(`^(${ENV.TELEGRAM_ADMIN})$`);
  return ! (message.from === undefined || ! telegram_admins.test(`${message.chat.username}`) );
}

bot.onText(/^\/(H|h)elp( .*|$)/, async (message: Message) => {
  try {
    if (message.from?.is_bot){
      console.error(`Bot message. Command: ${pretty(message)}`);
      return;
    }
    if (fromAdmins(message)) {
      await helpAdmin(message, i18n, db, bot);
    } else {
      await help(message, i18n, db, bot);
    }
  } catch (error) {
    console.error(`Error while displaying help command. Error: ${error}. Command: ${pretty(message)}`);
  }
});
