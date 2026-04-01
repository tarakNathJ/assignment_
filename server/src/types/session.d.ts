import "express";

declare module "express" {
  interface Request {
    session: any;
    sessionID: string; // for backward compatibility in some places, or we replace all
  }
}

export {};
