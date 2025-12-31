import axios from 'axios'
import * as cheerio from 'cheerio'
import { downloadThumbnail } from '../utils/downloader'
import { db } from '../db/database'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function scrapeWorkMetadata(rjCode: string) {
    const url = `https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`

    try {
        console.log(`[Scraper] Fetching metadata for ${rjCode}...`)
        const { data } = await axios.get(url, {
            headers: {
                'Accept-Language': 'ja-JP,ja;q=0.9',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        const $ = cheerio.load(data)

        const title = $('#work_name').text().trim()
        const circleName = $('.maker_name a').text().trim()

        // CV extract (can be multiple)
        const cvRow = $('#work_outline th:contains("声優")').next('td').text().trim()

        const thumbnailURL = $('meta[property="og:image"]').attr('content')
        let localThumbnailPath = null

        if (thumbnailURL) {
            localThumbnailPath = await downloadThumbnail(rjCode, thumbnailURL)
        }

        // Update DB
        await db
            .updateTable('works')
            .set({
                title,
                circle_name: circleName,
                cv_names: cvRow || null,
                thumbnail_path: localThumbnailPath
            })
            .where('id', '=', rjCode)
            .execute()

        console.log(`[Scraper] Successfully updated ${rjCode}`)

    } catch (error) {
        console.error(`[Scraper] Failed to scrape ${rjCode}:`, error)
    }
}

export async function scrapeMissingMetadata() {
    const worksWithoutMetadata = await db
        .selectFrom('works')
        .where('title', 'is', null)
        .select('id')
        .execute()

    console.log(`[Scraper] Found ${worksWithoutMetadata.length} works missing metadata.`)

    for (const work of worksWithoutMetadata) {
        await scrapeWorkMetadata(work.id)

        // Random delay between 2-5 seconds
        const delay = Math.floor(Math.random() * 3000) + 2000
        console.log(`[Scraper] Sleeping for ${delay}ms...`)
        await sleep(delay)
    }
}
