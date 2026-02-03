import { drizzle } from 'drizzle-orm/node-postgres';
import { logger } from 'loggisch';

export const db = drizzle(process.env.DATABASE_URL!, {
  logger: {
    logQuery: (query, params) => {
      logger.trace('SQL:', query);
      logger.trace('Params:', params);
    },
  },
});
