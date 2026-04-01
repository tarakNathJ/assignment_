import "express-session";

declare module "express-session" {
  interface SessionData {
    authed?: boolean;
    db?: {
      mode: "demo" | "custom";
      label: string;
    };
  }
}
