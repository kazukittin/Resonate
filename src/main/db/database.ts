import Database from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import { app } from 'electron'
import { join } from 'path'
import { Database as DatabaseSchema } from './schema'

// Set database file path in user data directory
const dbPath = join(app.getPath('userData'), 'resonate.db')

const dialect = new SqliteDialect({
    database: new Database(dbPath)
})

export const db = new Kysely<DatabaseSchema>({
    dialect
})

export async function initDatabase() {
    // Create works table
    await db.schema
        .createTable('works')
        .ifNotExists()
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('title', 'text')
        .addColumn('circle_name', 'text')
        .addColumn('cv_names', 'text')
        .addColumn('tags', 'text')
        .addColumn('description', 'text')
        .addColumn('thumbnail_path', 'text')
        .addColumn('local_path', 'text', (col) => col.notNull())
        .addColumn('last_played_at', 'text')
        .addColumn('created_at', 'text', (col) => col.defaultTo('CURRENT_TIMESTAMP'))
        .addColumn('scrape_status', 'text', (col) => col.defaultTo('pending'))
        .execute()

    // Add columns to existing table if they don't exist
    try {
        await db.schema.alterTable('works').addColumn('tags', 'text').execute()
    } catch { }

    try {
        await db.schema.alterTable('works').addColumn('scrape_status', 'text').execute()
    } catch { }

    // Create play_history table
    await db.schema
        .createTable('play_history')
        .ifNotExists()
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('work_id', 'text', (col) => col.notNull().references('works.id').onDelete('cascade'))
        .addColumn('file_path', 'text', (col) => col.notNull())
        .addColumn('last_position', 'real', (col) => col.defaultTo(0))
        .addColumn('updated_at', 'text', (col) => col.defaultTo('CURRENT_TIMESTAMP'))
        .execute()

    // Create playlists table
    await db.schema
        .createTable('playlists')
        .ifNotExists()
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) => col.defaultTo('CURRENT_TIMESTAMP'))
        .addColumn('updated_at', 'text', (col) => col.defaultTo('CURRENT_TIMESTAMP'))
        .execute()

    // Create playlist_tracks table
    await db.schema
        .createTable('playlist_tracks')
        .ifNotExists()
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('playlist_id', 'integer', (col) => col.notNull().references('playlists.id').onDelete('cascade'))
        .addColumn('track_path', 'text', (col) => col.notNull())
        .addColumn('track_name', 'text', (col) => col.notNull())
        .addColumn('work_id', 'text')
        .addColumn('position', 'integer', (col) => col.notNull())
        .addColumn('added_at', 'text', (col) => col.defaultTo('CURRENT_TIMESTAMP'))
        .execute()

    console.log(`[DB] Database initialized at: ${dbPath}`)
}

export async function resetDatabase() {
    await db.deleteFrom('play_history').execute()
    await db.deleteFrom('works').execute()
    console.log('[DB] Database reset: all works and history cleared.')
}
