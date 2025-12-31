import { db } from '../db/database'
import { WorksTable } from '../db/schema'
import { GetWorksOptions } from '../../common/types'

export async function getAllWorks(options: GetWorksOptions = { sortBy: 'added_desc' }) {
    let query = db.selectFrom('works').selectAll()

    if (options.searchQuery) {
        const search = `%${options.searchQuery}%`
        query = query.where((eb) =>
            eb.or([
                eb('title', 'like', search),
                eb('circle_name', 'like', search),
                eb('cv_names', 'like', search),
                eb('id', 'like', search)
            ])
        )
    }

    switch (options.sortBy) {
        case 'added_desc':
            query = query.orderBy('created_at', 'desc')
            break
        case 'release_date_desc':
            // Fallback since release_date is not in schema yet
            query = query.orderBy('id', 'desc')
            break
        case 'last_played_desc':
            query = query.orderBy('last_played_at', 'desc')
            break
        case 'title_asc':
            query = query.orderBy('title', 'asc')
            break
    }

    return await query.execute()
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
            })
        )
        .executeTakeFirst()
}

export async function getWorkById(id: string) {
    return await db.selectFrom('works').where('id', '=', id).selectAll().executeTakeFirst()
}

import { app } from 'electron'
import fs from 'fs-extra'
import path from 'path'

export async function updateWork(id: string, data: Partial<WorksTable> & { new_cover_path?: string }) {
    let updateData: any = { ...data }
    delete updateData.new_cover_path

    if (data.new_cover_path) {
        const userDataPath = app.getPath('userData')
        const coversDir = path.join(userDataPath, 'covers')
        await fs.ensureDir(coversDir)

        const ext = path.extname(data.new_cover_path)
        const fileName = `${id}_${Date.now()}${ext}`
        const destPath = path.join(coversDir, fileName)

        await fs.copy(data.new_cover_path, destPath)
        updateData.thumbnail_path = destPath
    }

    return await db
        .updateTable('works')
        .set(updateData)
        .where('id', '=', id)
        .executeTakeFirst()
}
