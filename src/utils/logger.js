const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  info(message, metadata = {}) {
    console.info(JSON.stringify({
      level: "info",
      message,
      ...(isProduction ? {} : { metadata }),
      timestamp: new Date().toISOString(),
    }));
  },

  warn(message, metadata = {}) {
    console.warn(JSON.stringify({
      level: "warn",
      message,
      metadata,
      timestamp: new Date().toISOString(),
    }));
  },

  error(message, metadata = {}) {
    console.error(JSON.stringify({
      level: "error",
      message,
      metadata,
      timestamp: new Date().toISOString(),
    }));
  },
};