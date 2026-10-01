import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const players = pgTable('zesto_players', {
  wallet: text('wallet').primaryKey(),
  character: text('character').notNull().default('blu'),
  totalPoints: integer('total_points').notNull().default(0),
  totalDigs: integer('total_digs').notNull().default(0),
  bestRarity: text('best_rarity'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const digs = pgTable('zesto_digs', {
  id: serial('id').primaryKey(),
  wallet: text('wallet').notNull(),
  txHash: text('tx_hash').notNull().unique(),
  character: text('character').notNull(),
  rarity: text('rarity').notNull(),
  item: text('item').notNull(),
  points: integer('points').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
