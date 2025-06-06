import { bigserial, customType, jsonb, pgTable, text } from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return 'bytea';
  },
});

export const styleTable = pgTable('styles', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  styleId: text('style_id').notNull().unique(),
  title: text(),
  style: text(),
  metadata: jsonb(),
  format: text()
});

export const resourceTable = pgTable('resources', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  resourceId: text('resource_id').notNull().unique(),
  format: text().notNull(),
  data: bytea('data').notNull(),
});
