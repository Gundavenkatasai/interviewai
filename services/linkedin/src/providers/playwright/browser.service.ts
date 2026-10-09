export class BrowserService {
  private static browserInstance: any = null;
  private static activePages: number = 0;
  private static readonly MAX_CONCURRENT_PAGES = 2;
  private static isShuttingDown: boolean = false;

  /**
   * Acquires a browser instance or initializes singleton
   */
  private static async getBrowser(): Promise<any> {
    if (this.browserInstance && this.browserInstance.isConnected()) {
      return this.browserInstance;
    }

    try {
      // Try requiring puppeteer (installed in api-node)
      let puppeteer: any;
      try {
        puppeteer = require("puppeteer");
      } catch {
        try {
          puppeteer = require("playwright").chromium;
        } catch {
          throw new Error("Neither Puppeteer nor Playwright is available in the current environment.");
        }
      }

      this.browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--window-size=1280,800",
        ],
      });

      // Register process exit cleanup
      const cleanup = async () => {
        if (!this.isShuttingDown && this.browserInstance) {
          this.isShuttingDown = true;
          try {
            await this.browserInstance.close();
          } catch {}
          this.browserInstance = null;
        }
      };

      process.once("exit", cleanup);
      process.once("SIGINT", cleanup);
      process.once("SIGTERM", cleanup);

      return this.browserInstance;
    } catch (err: any) {
      throw new Error(`Failed to initialize headless browser: ${err.message}`);
    }
  }

  /**
   * Executes an action with bounded page concurrency and strict resource cleanup
   */
  static async withPage<T>(
    action: (page: any) => Promise<T>,
    options: { timeoutMs?: number } = {}
  ): Promise<T> {
    if (this.activePages >= this.MAX_CONCURRENT_PAGES) {
      throw new Error("Browser concurrency limit reached (max 2 active pages). Please retry shortly.");
    }

    this.activePages += 1;
    let page: any = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Configure timeout and realistic user-agent
      const timeout = options.timeoutMs || 15000;
      page.setDefaultTimeout(timeout);
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      );

      // Block unnecessary heavy media assets to conserve bandwidth and CPU
      if (page.setRequestInterception) {
        await page.setRequestInterception(true);
        page.on("request", (req: any) => {
          const resType = req.resourceType();
          if (["image", "stylesheet", "font", "media"].includes(resType)) {
            req.abort();
          } else {
            req.continue();
          }
        });
      }

      return await action(page);
    } finally {
      this.activePages = Math.max(0, this.activePages - 1);
      if (page) {
        try {
          await page.close();
        } catch {}
      }
    }
  }

  static async shutdown(): Promise<void> {
    if (this.browserInstance) {
      try {
        await this.browserInstance.close();
      } catch {}
      this.browserInstance = null;
    }
    this.activePages = 0;
  }
}
