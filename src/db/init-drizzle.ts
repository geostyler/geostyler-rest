import { drizzle } from 'drizzle-orm/node-postgres';
import log from 'loggisch';

export const db = drizzle(process.env.DATABASE_URL!, {
  logger: {
    logQuery: (query, params) => {
      log.trace('SQL:', query);
      log.trace('Params:', params);
    },
  },
});
