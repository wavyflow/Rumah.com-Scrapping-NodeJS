import puppeteer from 'puppeteer-extra'
import stealthPlugin from 'puppeteer-extra-plugin-stealth'
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'
import { Browser, Page, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY  } from 'puppeteer'

puppeteer.use(stealthPlugin())
puppeteer.use(
    AdblockerPlugin({
      // Optionally enable Cooperative Mode for several request interceptors
      interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
    })
  )
  

export class Scrape {
    private static browser: Browser | null = null
    private static page: Page | null = null

    constructor() {}

    static async init() {
        this.browser = await puppeteer.launch({
            headless: false,
            userDataDir: './userData',
        })
    }

    static async crawl(url: string, waitForSelector = 'section#search-results-container') {
        if (!this.browser) {
            return false
        }

        this.page = await this.browser.newPage()

        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

        await Promise.all([
            this.page.setViewport({
                width: 1920 + Math.floor(Math.random() * 100),
                height: 3000 + Math.floor(Math.random() * 100),
                deviceScaleFactor: 1,
                hasTouch: false,
                isLandscape: false,
                isMobile: false,
            }),
            this.page.setUserAgent(userAgent),
            this.page.setJavaScriptEnabled(true),
            this.page.setDefaultNavigationTimeout(0),
            this.page.setRequestInterception(true),
        ])
    
        this.page.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                req.abort();
            } else {
                req.continue();
            }
        })

        await this.page.goto(url, {
            timeout: 0,
            waitUntil: 'networkidle2'
        })
        await this.page.waitForFunction(`document.querySelector("${waitForSelector}")`)
        await this.page.waitForSelector(waitForSelector)

        const content = await this.page.content()

        await this.page.close()

        return content
    }

    static async close() {
        await this.browser?.close()
    }
}