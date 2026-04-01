import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: env.corsOrigin === "*" ? true : env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(
  cookieSession({
    name: "bi.sid",
    secret: env.sessionSecret,
    httpOnly: true,
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    secure: env.nodeEnv === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }),
);

app.use("/api", router);
app.use(errorHandler);

// app.listen(env.port, () => {
//   console.log(`[server] Listening on port ${env.port} (${env.nodeEnv})`);
// });

export default app;