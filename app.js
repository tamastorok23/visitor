import Koa from 'koa';
import Router from 'koa-router';
import puppeteer from 'puppeteer';
import bodyParser from 'koa-bodyparser';
import path from 'path';
import fs from 'fs';
import ftp from 'basic-ftp';

const app = new Koa();
const router = new Router();

app.use(
  bodyParser({
    enableTypes: ['json', 'form'],
    formLimit: '10mb',
    jsonLimit: '10mb'
  })
);

router.get('/', (ctx) => {
    ctx.body = 'Welcome to the Heureka login example!';
});

router.get('/visit-page', async (ctx) => {
	ctx.status = 200
	
	const url = 'https://www.heureka.cz/?h%5Bfraze%5D=6941812720943';

    try {
        const result = await visitPage(url);
        ctx.body = result;
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Error: ${error.message}`;
    }
});

async function visitPage(url) {

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

    // Set a timeout for the entire page operation to ensure it completes in time
    const pageTimeout = setTimeout(async () => {
        await page.close();
        await browser.close();
        throw new Error('Page operation timed out');
    }, 28000); // Giving a buffer for the overall request timeout

    try {
		console.log('Navigating to login page...');
        await page.goto(url, { waitUntil: 'domcontentloaded' });
		
		console.log('Waiting 2 seconds...');
		await page.waitForTimeout(2000); // Wait for 2 seconds
		
		const data = await page.evaluate(() => document.querySelector('*').outerHTML);
		
		await browser.close();
		
		return data;
    } catch (error) {
        clearTimeout(pageTimeout);
        await page.close();
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