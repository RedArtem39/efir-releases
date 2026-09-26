// Every day at 18:00 asks "во что играем сегодня?" and at 21:00 announces the
// winner as an event. The bot needs "Создавать опросы" and "Создавать события".
//   EFIR_TOKEN=<токен> EFIR_URL=http://<сервер>:4318 EFIR_CHANNEL=<id канала> node examples/daily-poll.mjs
import { Bot } from "efir-bot";

const GAMES = ["CS2", "Dota 2", "Minecraft", "Сидим в голосовом"];
const channelId = process.env.EFIR_CHANNEL;
const bot = new Bot({ token: process.env.EFIR_TOKEN, url: process.env.EFIR_URL });
let today = null;

// Runs `job` every day at hh:mm local time.
function daily(hh, mm, job) {
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + 1);
  setTimeout(async () => {
    try {
      await job();
    } catch (e) {
      console.error(e);
    }
    daily(hh, mm, job);
  }, next - Date.now());
}

daily(18, 0, async () => {
  today = await bot.polls.create(channelId, { question: "Во что играем сегодня?", options: GAMES });
});

daily(21, 0, async () => {
  if (!today) return;
  const message = await bot.messages.get(channelId, today.message_id);
  await bot.polls.close(today.id);
  const top = [...message.poll.options].sort((a, b) => b.votes - a.votes)[0];
  if (!top?.votes) return;
  await bot.events.create(channelId, { title: top.text, starts: Date.now() + 15 * 60_000, description: "Победил в опросе" });
  today = null;
});

await bot.start();
