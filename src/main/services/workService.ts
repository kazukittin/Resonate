import { db } from '../db/database'
import { WorksTable } from '../db/schema'

export async function getAllWorks() {
    return await db.selectFrom('works').selectAll().execute()
}

export async function upsertWork(work: Omit<WorksTable, 'created_at'>) {
    return await db
        .insertInto('works')
        .values({
            ...work,
        })
        .onConflict((oc) =>
            oc.column('id').doUpdateSet({
                local_path: work.local_path,
                // We don't overwrite title/circle etc. if they already exist, 
                // because scaper will fill them later.
            })
        )
        .executeTakeFirst()
}

export async function getWorkById(id: string) {
    return await db.selectFrom('works').where('id', '=', id).selectAll().executeTakeFirst()
}
