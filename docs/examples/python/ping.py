# /ping answers "pong", /roll 20 throws a die, and the bot talks back in DMs.
#   EFIR_TOKEN=<токен> EFIR_URL=http://<сервер>:4318 python examples/ping.py
import os
import random

from efir_bot import Bot

bot = Bot(os.environ["EFIR_TOKEN"], os.environ["EFIR_URL"])


@bot.command("ping")
async def ping(msg):
    await msg.reply("pong")


@bot.command("roll")
async def roll(msg, args):
    top = int(args[0]) if args and args[0].isdigit() else 100
    await msg.reply(f"Выпало {random.randint(1, top)}")


@bot.on("message")
async def talk(msg):
    if msg.dm and not msg.text.startswith("/"):
        await msg.send(f"Вы написали: {msg.text}")


@bot.on("ready")
def ready(user):
    print(f"Бот @{user['username']} в сети")


bot.run()
