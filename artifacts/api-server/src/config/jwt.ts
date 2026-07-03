import { env } from "./env";

export const jwtConfig = {
  secret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: "15m",
  refreshExpiresIn: "7d",
};
