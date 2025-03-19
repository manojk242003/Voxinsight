const puppeteer = require('puppeteer');

async function getMyntraReviews(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    let allReviews = [];

    async function extractReviews() {
        try {
            await page.waitForSelector('.detailed-reviews-userReviewsContainer', { timeout: 5000 });

            const reviews = await page.$$eval('.user-review-userReviewWrapper', (reviewDivs) => {
                return reviewDivs.map((div) => ({
                    rating: div.querySelector('.user-review-starRating')?.textContent.trim() || '',
                    reviewText: div.querySelector('.user-review-reviewTextWrapper')?.textContent.trim() || '',
                }));
            });

            return reviews;
        } catch (error) {
            console.error(`Error extracting reviews:`, error);
            return [];
        }
    }

    // Scrape reviews from multiple pages
    while (true) {
        const reviews = await extractReviews();
        allReviews.push(...reviews);

        try {
            const nextButton = await page.$('.detailed-reviews-allReviews');
            if (!nextButton) break;

            const nextPageLink = await page.evaluate(el => el.href, nextButton);
            await page.goto(nextPageLink, { waitUntil: 'networkidle2' });

        } catch (error) {
            console.error('No more pages or error clicking next:', error);
            break;
        }
    }

    console.log(`Scraped ${allReviews.length} reviews.`);
    console.log('All Reviews:', allReviews);

    await browser.close();
    return { allReviews };
}

module.exports = { getMyntraReviews };
