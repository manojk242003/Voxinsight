const puppeteer = require('puppeteer');

async function getFlipkartReviews(url) {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    const productUrl = url;
    await page.goto(productUrl);

    let allReviews = [];
    const maxPages = 50; // Maximum number of pages to scrape
    let pageNumber = 1; // Start from page 1

    // Function to extract reviews from a given selector
    async function extractReviews(selector) {
        try {
            await page.waitForSelector(selector, {
                timeout: 5000
            });
            const reviews = await page.$$eval(selector, (reviewDivs) => {
                return reviewDivs.map((div) => {
                    const reviewText = div.querySelector('div.ZmyHeo')?.textContent.trim() || ''; // Adjust if needed
                    return reviewText;
                });
            });
            return reviews;
        } catch (error) {
            console.error(`Error extracting reviews from ${selector}:`, error);
            return [];
        }
    }

    //Click on "All Reviews" button with a more robust approach
    try {
        await page.waitForSelector('._23J90q.RcXBOT', {
            timeout: 5000
        });

        // Evaluate the click in the page context to avoid detachment issues
        await page.evaluate(() => {
            const allReviewsButton = document.querySelector('._23J90q.RcXBOT');
            if (allReviewsButton) {
                allReviewsButton.click();
            } else {
                throw new Error('All Reviews button not found');
            }
        });

        // Wait for the reviews to load instead of relying on a single navigation event
        await page.waitForSelector('.cPHDOP.col-12-12', {
            timeout: 10000
        });

    } catch (error) {
        console.error('Error clicking "All Reviews" button:', error);
        await browser.close();
        return;
    }

    // Function to navigate to the next page
    async function goToNextPage() {
        const nextButtonSelector = '.WSL9JP a._9QVEpD:last-of-type';
        try {
            await page.waitForSelector(nextButtonSelector, {
                timeout: 5000
            });

            // Extract the href attribute
            const nextPageUrl = await page.$eval(nextButtonSelector, (el) => el.href);

            if (nextPageUrl) {
                console.log(`Navigating to the next page: ${nextPageUrl}`);
                await page.goto(nextPageUrl, {
                    waitUntil: 'networkidle2',
                    timeout: 10000
                });
                return true;
            } else {
                console.log('Next button found, but href is empty. Stopping.');
                return false;
            }
        } catch (waitError) {
            console.log("Next button not found or error extracting href:", waitError);
            return false;
        }
    }

    while (pageNumber <= maxPages) {
        try {
            // Extract reviews from the current page
            const reviews = await extractReviews('.cPHDOP.col-12-12');
            allReviews.push(...reviews);
            console.log(`Scraped ${reviews.length} reviews from page ${pageNumber}.`);

            // Navigate to the next page
            const hasNextPage = await goToNextPage();
            if (!hasNextPage) {
                break;
            }
            console.log(`Successfully navigated to page ${pageNumber + 1}`);
            pageNumber++;
        } catch (error) {
            console.error('Error scraping reviews or navigating:', error);
            break;
        }
    }

    // No duplicate removal this time

    console.log(`Total reviews scraped: ${allReviews.length}`);
    console.log("All Reviews :");


    await browser.close();
    return allReviews;
}

module.exports = { getFlipkartReviews }; 