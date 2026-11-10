// Disposable loopback-only REST bridge to real Redis for secret-free CI.
// Implements the Upstash wire envelope; Redis itself executes the SDK's Lua.
import http from "node:http";
import net from "node:net";

if (
  process.env.CI_ENFORCE_INTEGRATION !== "1" ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
)
  throw Error("Redis REST fixture requires isolated CI configuration.");
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
function parse(buffer, offset = 0) {
  const end = buffer.indexOf("\r\n", offset);
  if (end < 0) return null;
  const type = String.fromCharCode(buffer[offset]);
  const value = buffer.toString("utf8", offset + 1, end);
  let cursor = end + 2;
  if (type === "+") return [value, cursor];
  if (type === "-") return [{ error: value }, cursor];
  if (type === ":") return [Number(value), cursor];
  if (type === "$") {
    const size = Number(value);
    if (size === -1) return [null, cursor];
    if (buffer.length < cursor + size + 2) return null;
    return [buffer.toString("utf8", cursor, cursor + size), cursor + size + 2];
  }
  if (type === "*") {
    const size = Number(value);
    if (size === -1) return [null, cursor];
    const values = [];
    for (let i = 0; i < size; i++) {
      const next = parse(buffer, cursor);
      if (!next) return null;
      values.push(next[0]);
      cursor = next[1];
    }
    return [values, cursor];
  }
  throw Error("Unsupported fixture response.");
}
function command(args) {
  // Upstash-only locking directive; OSS Redis executes the same Lua atomically.
  args = args.map((arg) =>
    typeof arg === "string"
      ? arg.replace(/^#!lua flags=allow-key-locking\n/, "")
      : arg,
  );
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: 6380 });
    let buffer = Buffer.alloc(0);
    socket.setTimeout(2500, () =>
      socket.destroy(Error("Redis fixture timeout.")),
    );
    socket.on("error", reject);
    socket.on("connect", () => {
      const parts = [Buffer.from("*" + args.length + "\r\n")];
      for (const arg of args) {
        const bytes = Buffer.from(String(arg));
        parts.push(
          Buffer.from("$" + bytes.length + "\r\n"),
          bytes,
          Buffer.from("\r\n"),
        );
      }
      socket.write(Buffer.concat(parts));
    });
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      try {
        const result = parse(buffer);
        if (result) {
          socket.end();
          resolve(result[0]);
        }
      } catch {
        socket.destroy();
        reject(Error("Invalid fixture reply."));
      }
    });
  });
}
http
  .createServer(async (request, response) => {
    response.setHeader("content-type", "application/json");
    if (request.headers.authorization !== "Bearer " + token) {
      response.writeHead(401).end("{}");
      return;
    }
    try {
      let body = "";
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 1000000) throw Error("Too large");
      }
      const input = JSON.parse(body);
      const batch = request.url === "/pipeline";
      const commands = batch ? input : [input];
      if (
        !Array.isArray(commands) ||
        commands.some((c) => !Array.isArray(c) || !c.length)
      )
        throw Error("Invalid");
      const replies = await Promise.all(
        commands.map(async (c) => {
          const result = await command(c);
          return result && typeof result === "object" && "error" in result
            ? result
            : { result };
        }),
      );
      response.end(JSON.stringify(batch ? replies : replies[0]));
    } catch {
      response
        .writeHead(503)
        .end(
          JSON.stringify({ error: "Disposable Redis fixture unavailable." }),
        );
    }
  })
  .listen(8079, "127.0.0.1", () =>
    console.log("Disposable Redis REST fixture listening on loopback."),
  );
