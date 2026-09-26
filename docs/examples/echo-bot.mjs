// Minimal Efir bot, Node.js 22+ with no dependencies.
// Replies "pong" to "!ping" and echoes direct messages.
//   EFIR_URL=http://127.0.0.1:4318 EFIR_TOKEN=... node examples/echo-bot.mjs

const base = process.env.EFIR_URL || "http://127.0.0.1:4318";
const token = process.env.EFIR_TOKEN;
if (!token) {
  console.error("Set EFIR_TOKEN to the token from @bot_bot.");
  process.exit(1);
}

async function api(method, route, body) {
  for (;;) {
    const response = await fetch(`${base}/api/v1${route}`, {
      method,
      headers: {
        Authorization: `Bot ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, data.retry_after * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`${response.status}: ${data.error}`);
    return data;
  }
}

let me;
function connect() {
  const ws = new WebSocket(`${base.replace(/^http/, "ws")}/api/gateway`);
  let beat;
  ws.onmessage = async (event) => {
    const { op, t, d } = JSON.parse(event.data);
    if (op === "hello") {
      ws.send(JSON.stringify({ op: "identify", d: { token } }));
      beat = setInterval(() => ws.send(JSON.stringify({ op: "heartbeat" })), d.heartbeat_interval);
      return;
    }
    if (op !== "dispatch") return;
    if (t === "READY") {
      me = d.user;
      console.log(`Logged in as @${me.username} on ${d.servers.length} server(s)`);
    }
    if (t === "MESSAGE_CREATE" && d.message.user_id !== me?.id) {
      const { channel_id, text } = d.message;
      if (text.trim() === "!ping") await api("POST", `/channels/${channel_id}/messages`, { text: "pong" });
      else if (d.dm) await api("POST", `/channels/${channel_id}/messages`, { text });
    }
  };
  ws.onclose = (event) => {
    clearInterval(beat);
    if (event.code === 4001) {
      console.error("Token rejected. Get a new one with /token in @bot_bot.");
      process.exit(1);
    }
    setTimeout(connect, 3000);
  };
}

connect();
