// /ping, /roll and an echo in DMs.
//   EFIR_TOKEN=<токен> EFIR_URL=http://<сервер>:4318 node examples/ping.mjs
import { Bot } from "efir-bot";

const bot = new Bot({ token: process.env.EFIR_TOKEN, url: process.env.EFIR_URL });

bot.command("ping", (msg) => msg.reply("pong"));

// /roll или /roll 20
bot.command("roll", (msg, args) => {
  const max = Math.max(2, Math.min(1_000_000, Number(args[0]) || 100));
  return msg.reply(`Выпало **${1 + Math.floor(Math.random() * max)}** из ${max}`);
});

bot.on("message", async (msg) => {
  if (msg.dm && !msg.text.startsWith("/")) await msg.send(msg.text || "Прислали файл, а я умею только текст");
});

const me = await bot.start();
console.log(`@${me.username} в сети на ${bot.cache.servers.length} серверах`);
