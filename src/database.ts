import { AceBase } from "acebase";

export const db = new AceBase("db", {
    sponsor: true,
    logLevel: "warn",
  });