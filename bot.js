const token = process.env.TOKEN;

const Bot = require("node-telegram-bot-api");
const Keyboard = require("node-telegram-keyboard-wrapper");
let bot;

if (process.env.NODE_ENV === "production") {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, { polling: true });
}

console.log("Bot server started in the " + process.env.NODE_ENV + " mode");

// bot.on("message", msg => {
//   const name = msg.from.first_name;
//   bot.sendMessage(msg.chat.id, "Create Events 7").then(() => {});
// });

const rk = new Keyboard.ReplyKeyboard();
const ik = new Keyboard.InlineKeyboard();
rk.addRow("➕ Neues Event erstellen");
ik.addRow({ text: "👍 Zusagen", callback_data: "Works!" });
bot.onText(/\/start/i, msg => {
  bot.sendMessage(
    msg.from.id,
    "Started Events Bot",
    rk.open({ resize_keyboard: true })
  );
});

bot.onText(/\/event/i, msg => {
  console.log("msg", msg.text);
  bot.sendMessage(msg.from.id, "sent text:" + msg.text, ik.build());
});

module.exports = bot;
