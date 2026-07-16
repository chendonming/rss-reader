const PREFIX = "[RSS]";

export const log = {
  info: (message: string, ...args: unknown[]) => {
    console.log(PREFIX, message, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(PREFIX, "[WARN]", message, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(PREFIX, "[ERROR]", message, ...args);
  },
};
