import Koa from 'koa';
import Router from 'koa-router';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import bodyParser from 'koa-bodyparser';

const app = new Koa();
const router = new Router();

puppeteer.use(StealthPlugin()); // Use stealth plugin

app.use(bodyParser());

router.get('/', (ctx) => {
    ctx.body = 'Welcome to the Heureka login example!';
});

router.post('/visit-page', async (ctx) => {
	ctx.status = 200
	
	console.log('START');
	console.log(ctx.request.body);
	
	const url = ctx.request.body.url;

    try {
        const result = await visitPage(url);
        ctx.body = result;
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Error: ${error.message}`;
    }
});

async function visitPage(url) {
    console.log(url);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--single-process'
        ],
        timeout: 30000 // Overall timeout for Puppeteer
    });

    const page = await browser.newPage();
	
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
	await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log('Navigating to page...');
        // Navigate to the page and wait for the network to be idle
        await page.goto(url, { waitUntil: 'networkidle2' });

        console.log('Waiting for 2 seconds...');
        await page.waitForTimeout(2000);

        // Get the entire page's HTML
        const data = await page.evaluate(() => document.documentElement.outerHTML);

        console.log('Closing browser...');
        await browser.close();

        return data;
    } catch (error) {
        console.error('Error:', error);
        await browser.close();
        throw error;
    }
}

app
  .use(router.routes())
  .use(router.allowedMethods());

const server = app.listen(process.env.PORT || 3000, () => console.log(`App listening on: localhost:3000`))

const shutdown = () => {
  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 35000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);