# Every day at 18:00 asks "во что играем сегодня?" and at 21:00 announces the
# winner as an event. The bot needs "Создавать опросы" and "Создавать события".
#   EFIR_TOKEN=<токен> EFIR_URL=http://<сервер>:4318 EFIR_CHANNEL=<id канала> python examples/daily_poll.py
import asyncio
import datetime as dt
import os
import time

from efir_bot import Bot

GAMES = ["CS2", "Dota 2", "Minecraft", "Сидим в голосовом"]
CHANNEL = os.environ["EFIR_CHANNEL"]
bot = Bot(os.environ["EFIR_TOKEN"], os.environ["EFIR_URL"])
today = None


async def daily(hh, mm, job):
    """Runs `job` every day at hh:mm local time."""
    while True:
        now = dt.datetime.now()
        at = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
        if at <= now:
            at += dt.timedelta(days=1)
        await asyncio.sleep((at - now).total_seconds())
        try:
            await job()
        except Exception as e:  # noqa: BLE001
            print(e)


async def ask():
    global today
    today = await bot.polls.create(CHANNEL, "Во что играем сегодня?", GAMES)


async def announce():
    global today
    if not today:
        return
    message = await bot.messages.get(CHANNEL, today["message_id"])
    await bot.polls.close(today["id"])
    top = max(message.poll["options"], key=lambda o: o["votes"])
    if top["votes"]:
        starts = int(time.time() * 1000) + 15 * 60_000
        await bot.events.create(CHANNEL, top["text"], starts, description="Победил в опросе")
    today = None


@bot.on("ready")
def schedule(user):
    asyncio.ensure_future(daily(18, 0, ask))
    asyncio.ensure_future(daily(21, 0, announce))


bot.run()
