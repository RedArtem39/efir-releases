// Moderation: removes messages with banned words, /kick for people with the right,
// greets newcomers. The bot needs a role with "Управлять сообщениями" and
// "Выгонять участников".
//   EFIR_TOKEN=<токен> EFIR_URL=http://<сервер>:4318 node examples/moderation.mjs
import { Bot, EfirError, Permissions, hasPermission } from "efir-bot";

const BANNED = ["казино", "бесплатные скины"];
const bot = new Bot({ token: process.env.EFIR_TOKEN, url: process.env.EFIR_URL });

bot.on("message", async (msg) => {
  if (!msg.server_id || msg.author.bot) return;
  const text = msg.text.toLowerCase();
  if (!BANNED.some((word) => text.includes(word))) return;
  await msg.delete();
  await msg.send(`@${msg.author.username}, такое здесь нельзя.`);
});

// /kick @username причина — only for members who may kick themselves.
bot.command("kick", async (msg, args) => {
  if (!msg.server_id) return;
  const server = await bot.servers.get(msg.server_id);
  const author = server.members.find((m) => m.id === msg.user_id);
  const allowed = server.owner_id === msg.user_id || author?.roles.some((id) => {
    const role = server.roles.find((r) => r.id === id);
    return role && (hasPermission(role.permissions, Permissions.KICK_MEMBERS) || hasPermission(role.permissions, Permissions.ADMINISTRATOR));
  });
  if (!allowed) return msg.reply("У вас нет права выгонять участников.");
  const target = server.members.find((m) => `@${m.username}`.toLowerCase() === (args[0] || "").toLowerCase());
  if (!target) return msg.reply("Кого? Напишите /kick @имя");
  try {
    await bot.members.kick(msg.server_id, target.id, args.slice(1).join(" ") || undefined);
    await msg.reply(`@${target.username} выгнан.`);
  } catch (e) {
    if (e instanceof EfirError) await msg.reply(`Не получилось: ${e.message}`);
    else throw e;
  }
});

bot.on("memberJoin", async ({ server_id, user }) => {
  if (user.id === bot.user.id) return;
  const server = bot.cache.servers.find((s) => s.id === server_id);
  const general = server?.channels.find((c) => c.kind === "text" && hasPermission(c.permissions, Permissions.SEND_MESSAGES));
  if (general) await bot.messages.send(general.id, `Привет, @${user.username}!`);
});

await bot.start();
