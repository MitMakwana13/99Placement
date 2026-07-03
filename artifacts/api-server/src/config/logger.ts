import pino from "pino";
import { env } from "./env";
import { logLocalStorage } from "./als";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "password",
      "password_hash",
      "refreshToken",
      "accessToken",
      "token",
      "secret",
      "clientSecret",
    ],
    censor: "[REDACTED]",
  },
  mixin() {
    const store = logLocalStorage.getStore();
    if (store) {
      return {
        requestId: store.requestId,
        tenantId: store.tenantId,
        userId: store.userId,
      };
    }
    return {};
  },
  ...(env.NODE_ENV === "production"
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
});
export default logger;
