import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

(async () => {
  const b = await puppeteer.launch({headless: true});
  const p = await b.newPage();
  await p.goto('https://internshala.com/internships/keywords-software/', {waitUntil: 'networkidle2'});
  const html = await p.$eval('.individual_internship', el => el.innerHTML).catch(e => 'Not found');
  console.log(html);
  await b.close();
})();
