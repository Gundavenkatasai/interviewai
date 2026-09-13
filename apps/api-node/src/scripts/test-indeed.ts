import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

(async () => {
  const b = await puppeteer.launch({headless: true});
  const p = await b.newPage();
  await p.goto('https://in.indeed.com/jobs?q=software+engineer', {waitUntil: 'networkidle2'});
  const html = await p.$eval('td.resultContent', el => el.innerHTML);
  console.log(html);
  await b.close();
})();
