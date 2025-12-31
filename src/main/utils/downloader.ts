import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export async function downloadThumbnail(rjCode: string, url: string): Promise<string> {
    const thumbnailDir = path.join(app.getPath('userData'), 'thumbnails')
    if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true })
    }

    const ext = path.extname(new URL(url).pathname) || '.jpg'
    const fileName = `${rjCode}${ext}`
    const filePath = path.join(thumbnailDir, fileName)

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    const writer = fs.createWriteStream(filePath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath))
        writer.on('error', reject)
    })
}
