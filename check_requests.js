const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set desktop viewport size
  await page.setViewport({ width: 1200, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log('Navigating to home.html...');
  await page.goto('http://localhost:8000/home.html', { waitUntil: 'networkidle2' });

  // Log all li elements inside desktop-nav
  const lisInfo = await page.evaluate(() => {
    const list = document.querySelectorAll('header.site-topnav li');
    return Array.from(list).map((li, index) => {
      const link = li.querySelector('a');
      return {
        index,
        text: link ? link.textContent.trim() : 'No link',
        hasDrop: !!li.querySelector('.drop'),
        classes: li.className
      };
    });
  });
  console.log('Found li items:', lisInfo);

  // Hover over the first item that has a drop
  const dropIndex = lisInfo.findIndex(item => item.hasDrop);
  if (dropIndex !== -1) {
    console.log(`Hovering over item index ${dropIndex}: ${lisInfo[dropIndex].text}`);
    const selector = `header.site-topnav li:nth-child(${dropIndex + 1})`;
    // Wait for selector to be visible
    await page.waitForSelector(selector, { visible: true });
    
    // Get element dimensions to see if it is visible
    const box = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }, selector);
    console.log('Element bounding box:', box);

    if (box && box.width > 0 && box.height > 0) {
      await page.hover(selector);
      await new Promise(r => setTimeout(r, 1000));
      const classesAfter = await page.evaluate((sel) => {
        return document.querySelector(sel).className;
      }, selector);
      console.log('Classes after hover:', classesAfter);
      
      const dropVisible = await page.evaluate((sel) => {
        const drop = document.querySelector(sel + ' .drop');
        return drop ? window.getComputedStyle(drop).display : 'no drop';
      }, selector);
      console.log('Dropdown display value after hover:', dropVisible);
    } else {
      console.log('Element is not visible or has 0 size!');
    }
  } else {
    console.log('No item with dropdown (.drop) found!');
  }

  await browser.close();
})();
