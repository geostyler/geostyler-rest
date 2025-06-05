import { bigserial, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';

export const styleTable = pgTable('styles', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  styleId: text('style_id').notNull().unique(),
  title: text(),
  style: text(),
  metadata: jsonb(),
  format: text()
});
