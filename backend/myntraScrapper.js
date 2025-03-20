const puppeteer = require('puppeteer');

async function getMyntraReviews(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const productUrl = url;
    await page.goto(productUrl);

    let allReviews = [];
    const maxScrolls = 10; // Maximum number of scrolls
    let scrollCount = 0;

    // Custom delay function for waiting
    function delay(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    // Click on "All Reviews" button
    try {
        await page.waitForSelector('a.detailed-reviews-allReviews', { timeout: 5000 });
        await page.evaluate(() => {
            const allReviewsButton = document.querySelector('a.detailed-reviews-allReviews');
            if (allReviewsButton) {
                allReviewsButton.click();
            } else {
                throw new Error('"All Reviews" button not found');
            }
        });

        // Wait for reviews to load
        await page.waitForSelector('div.user-review-reviewTextWrapper', { timeout: 10000 });
    } catch (error) {
        console.error('Error clicking "All Reviews" button:', error);
        await browser.close();
        return [];
    }

    // Function to extract reviews from the current page
    async function extractReviews() {
        try {
            const reviews = await page.$$eval('div.user-review-reviewTextWrapper', (reviewDivs) => {
                return reviewDivs.map((div) => div.textContent.trim());
            });
            return reviews;
        } catch (error) {
            console.error('Error extracting reviews:', error);
            return [];
        }
    }

    // Infinite scroll logic with stop condition
    while (scrollCount < maxScrolls) {
        try {
            // Track the number of reviews before scrolling
            const previousReviewCount = allReviews.length;

            // Scroll to the bottom of the page
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));

            // Wait for new content to load
            await delay(2000); // Wait for 2 seconds

            // Extract reviews from the current view
            const reviews = await extractReviews();
            allReviews.push(...reviews);

            console.log(`Scroll ${scrollCount + 1}: Scraped ${reviews.length} reviews. Total so far: ${allReviews.length}`);

            // Check if new reviews were loaded
            if (allReviews.length === previousReviewCount) {
                console.log('No new reviews loaded. Stopping scroll.');
                break; // Stop scrolling if no new reviews are found
            }

            scrollCount++;
        } catch (error) {
            console.error('Error during scrolling or scraping:', error);
            break;
        }
    }

    console.log(`Total reviews scraped: ${allReviews.length}`);

    await browser.close();
    return allReviews;
}

module.exports = { getMyntraReviews };
