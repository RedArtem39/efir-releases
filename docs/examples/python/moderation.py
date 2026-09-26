# Removes messages with banned words, /kick for people with the right, greets
# newcomers. The bot needs a role with "Управлять сообщениями" and "Выгонять участников".
#   EFIR_TOKEN=<токен> EFIR_URL=http://<сервер>:4318 python examples/moderation.py
import os

from efir_bot import Bot, EfirError, Permissions, has_permission

BANNED = ["казино", "бесплатные скины"]
bot = Bot(os.environ["EFIR_TOKEN"], os.environ["EFIR_URL"])


@bot.on("message")
async def clean(msg):
    if not msg.server_id or msg.author.bot:
        return
    if any(word in msg.text.lower() for word in BANNED):
        await msg.delete()
        await msg.send(f"@{msg.author.username}, такое здесь нельзя.")


def may_kick(server, user_id):
    if server["owner_id"] == user_id:
        return True
    member = next((m for m in server["members"] if m["id"] == user_id), None)
    roles = {r["id"]: r for r in server["roles"]}
    return bool(member) and any(
        has_permission(roles[r]["permissions"], Permissions.KICK_MEMBERS)
        or has_permission(roles[r]["permissions"], Permissions.ADMINISTRATOR)
        for r in member["roles"]
        if r in roles
    )


# /kick @username причина — only for members who may kick themselves.
@bot.command("kick")
async def kick(msg, args):
    if not msg.server_id:
        return
    server = await bot.servers.get(msg.server_id)
    if not may_kick(server, msg.user_id):
        return await msg.reply("У вас нет права выгонять участников.")
    name = (args[0] if args else "").lower()
    target = next((m for m in server["members"] if f"@{m['username']}".lower() == name), None)
    if not target:
        return await msg.reply("Кого? Напишите /kick @имя")
    try:
        await bot.members.kick(msg.server_id, target["id"], " ".join(args[1:]) or None)
        await msg.reply(f"@{target['username']} выгнан.")
    except EfirError as e:
        await msg.reply(f"Не получилось: {e}")


@bot.on("member_join")
async def greet(d):
    if d["user"]["id"] == bot.user["id"]:
        return
    server = next((s for s in bot.cache["servers"] if s["id"] == d["server_id"]), None)
    channel = next(
        (c for c in (server or {}).get("channels", []) if c["kind"] == "text" and has_permission(c.get("permissions"), Permissions.SEND_MESSAGES)),
        None,
    )
    if channel:
        await bot.messages.send(channel["id"], f"Привет, @{d['user']['username']}!")


bot.run()
