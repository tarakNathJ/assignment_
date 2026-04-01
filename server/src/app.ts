import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

// Trust Vercel proxy for secure cookies
app.set("trust proxy", true);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins specifically for cross-domain credentials
      callback(null, origin || true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Accept"],
    exposedHeaders: ["set-cookie"],
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const isVercel = !!process.env.VERCEL || env.nodeEnv === "production";

app.use(
  cookieSession({
    name: "bi.sid",
    keys: [env.sessionSecret], // 'keys' is preferred over 'secret'
    httpOnly: true,
    sameSite: isVercel ? "none" : "lax",
    secure: isVercel,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }),
);

// Bearer Token Fallback (bypasses 3rd-party cookie blocks)
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.substring(7);
    if (!req.session) {
      req.session = {} as any;
    }
    (req.session as any).authed = true;
    (req.session as any).sid = token;
  }
  next();
});

app.use("/api", router);
app.use(errorHandler);

// app.listen(env.port, () => {
//   console.log(`[server] Listening on port ${env.port} (${env.nodeEnv})`);
// });

export default app;