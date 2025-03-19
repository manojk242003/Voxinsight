const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const Sentiment = require('sentiment');
const sentimentAnalyzer = new Sentiment();
const https = require('https');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const puppeteer = require('puppeteer');
const { getFlipkartReviews } = require('./flipkartScraper');
const {getMyntraReviews}=require('./myntraScraper');
require('dotenv').config();


// Create a custom axios instance with configuration
const instance = axios.create({
    timeout: 60000, // 60 seconds timeout
    httpsAgent: new https.Agent({ 
        keepAlive: true,
        rejectUnauthorized: false,
        timeout: 60000
    }),
    maxRedirects: 5,
    validateStatus: function (status) {
        return status >= 200 && status < 303;
    }
});

// Add retry interceptor with exponential backoff
instance.interceptors.response.use(undefined, async (err) => {
    const { config } = err;
    if (!config || !config.retry) {
        return Promise.reject(err);
    }
    
    // Exponential backoff delay
    const backoffDelay = Math.min(1000 * (2 ** (3 - config.retry)), 10000);
    config.retry -= 1;
    
    // Log retry attempt
    console.log(`Retrying request (${3 - config.retry}/3) after ${backoffDelay}ms delay`);
    
    const delayRetry = new Promise(resolve => setTimeout(resolve, backoffDelay));
    await delayRetry;
    
    // Rotate User-Agent on retry
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    ];
    
    config.headers['User-Agent'] = userAgents[Math.floor(Math.random() * userAgents.length)];
    return instance(config);
});

const app = express();

app.use(cors());

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function getProductDetails(url) {
   
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Connection': 'keep-alive',
            'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        };

        // Configuration for the request
        const config = {
            headers,
            timeout: 30000,
            retry: 3, // Number of retries
            validateStatus: function (status) {
                return status >= 200 && status < 303;
            }
        };

        // First try mobile version
        let response;
        try {
            const mobileUrl = url.replace('www.amazon', 'm.amazon');
            response = await instance.get(mobileUrl, config);
        } catch (error) {
            console.log('Mobile version failed, trying desktop version');
            response = await instance.get(url, config);
        }

        let $ = cheerio.load(response.data);
        
        // Check if we got a valid response
        let productName = $('#productTitle').text().trim();
        
        // If mobile version failed, try desktop version
        if (!productName) {
            response = await axios.get(url, {
                headers,
                timeout: 10000
            });
            $ = cheerio.load(response.data);
            productName = $('#productTitle').text().trim();
        }

        // Log the HTML content for debugging
        console.log('Response HTML preview:', response.data.substring(0, 500));

        const productImage = $('#landingImage').attr('src') || 
                           $('#imgBlkFront').attr('src') || 
                           $('#main-image').attr('src');

        // Get total number of global ratings
        let totalRatings = 0;
        const ratingElements = [
            '#acrCustomerReviewText',
            '#ratings-summary span[data-hook="total-rating-count"]',
            '#averageCustomerReviews_feature_div .a-size-base',
            'span[data-hook="total-review-count"]',
            '#acrCustomerReviewLink',
            '.totalRatingCount',
            '[data-hook="total-rating-count"]'
        ];
        
        for (const selector of ratingElements) {
            const text = $(selector).text().trim();
            console.log(`Rating text from ${selector}:`, text);
            const match = text.match(/[\d,]+/);
            if (match) {
                totalRatings = parseInt(match[0].replace(/,/g, ''));
                break;
            }
        }

        // Get rating percentages from specified div and spans
        const ratingDistribution = {
            '5 Stars': 0,
            '4 Stars': 0,
            '3 Stars': 0,
            '2 Stars': 0,
            '1 Star': 0
        };

        const ratingDivs = $('div.a-section.a-spacing-none.a-text-right.aok-nowrap');

        if (ratingDivs.length > 0) {
            ratingDivs.each((index, element) => {
                const spans = $(element).find('span');
                spans.each((spanIndex, spanElement) => {
                    const percentageText = $(spanElement).text().trim();
                    const match = percentageText.match(/(\d+)%/);
                    if (match) {
                        const percentage = parseInt(match[1]);
                        const stars = 5 - spanIndex;
                        const numberOfRatings = Math.round((percentage / 100) * totalRatings);
                        ratingDistribution[`${stars} Star${stars === 1 ? '' : 's'}`] = numberOfRatings;
                    }
                });
            });
        }

        // Get average rating
        let averageScore = "0.0";
        const ratingSelectors = [
            '.reviewCountTextLinkedHistogram',
            '#acrPopover .a-icon-alt',
            'span[data-hook="rating-out-of-text"]',
            '#averageCustomerReviews .a-icon-star',
            '.a-icon-star .a-icon-alt',
            '[data-hook="rating-out-of-text"]',
            '#acrPopover',
            '.a-size-base .a-color-base'
        ];

        for (const selector of ratingSelectors) {
            const element = $(selector);
            const text = element.text().trim();
            console.log(`Rating element ${selector}:`, text);
            const match = text.match(/(\d+(\.\d+)?)/);
            if (match) {
                averageScore = match[1];
                break;
            }
        }

        // If we still don't have an average score but have ratings, calculate it
        if (averageScore === "0.0" && totalRatings > 0) {
            const totalStars = Object.entries(ratingDistribution).reduce((acc, [key, value]) => {
                const stars = parseInt(key);
                return acc + (stars * value);
            }, 0);
            averageScore = (totalStars / totalRatings).toFixed(1);
        }

        // Log the scraped data for debugging
        console.log('Scraped Data:', {
            productName,
            totalRatings,
            ratingDistribution,
            averageScore,
            url
        });

        if (!productName) {
            console.log('Full HTML:', response.data);
            throw new Error('Product name not found - possible bot detection');
        }

        return {
            productName,
            productImage,
            ratingDistribution,
            totalRatings,
            averageScore
        };
    
}

async function getAIProductFeedback(reviews, averageScore) {
    const prompt = `Considering the following reviews and an average score of ${averageScore}, provide feedback on the product: ${reviews.join("\n")}, format should be Positive aspect then negative aspects and then overall summary of feedback`;
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error('Error generating AI feedback:', err);
        return 'AI feedback not available';
    }
}

async function FgetProductDetails(url) {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Extract product details
        const fproductName = await page.$eval('h1._6EBuvT span.VU-ZEz', el => el.textContent.trim());
        const fproductImage = await page.$eval('img.DByuf4.IZexXJ.jLEJ7H', el => el.src);

        // Update selectors for rating distribution
        const fratingDistribution = {
            '5 Stars': parseInt(await page.$eval('ul.\\+psZUR li:nth-child(1) .BArk-j', el => el.textContent.replace(/,/g, '')), 10),
            '4 Stars': parseInt(await page.$eval('ul.\\+psZUR li:nth-child(2) .BArk-j', el => el.textContent.replace(/,/g, '')), 10),
            '3 Stars': parseInt(await page.$eval('ul.\\+psZUR li:nth-child(3) .BArk-j', el => el.textContent.replace(/,/g, '')), 10),
            '2 Stars': parseInt(await page.$eval('ul.\\+psZUR li:nth-child(4) .BArk-j', el => el.textContent.replace(/,/g, '')), 10),
            '1 Star': parseInt(await page.$eval('ul.\\+psZUR li:nth-child(5) .BArk-j', el => el.textContent.replace(/,/g, '')), 10)
        };

        const ftotalRatings = Object.values(fratingDistribution).reduce((acc, val) => acc + val, 0);

        const faverageScore = await page.$eval('div.XQDdHH', el => el.textContent.trim()) || "0.0";

        console.log('Scraped Data:', {
            fproductName,
            fproductImage,
            fratingDistribution,
            ftotalRatings,
            faverageScore
        });

        return {
            fproductName,
            fproductImage,
            fratingDistribution,
            ftotalRatings,
            faverageScore
        };
    } catch (error) {
        console.error('Error fetching product details with Puppeteer:', error.message);
        throw new Error('Failed to fetch product details');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
async function getMyntraProductDetails(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    try {
        // Extract product details
        const productDetails = await page.evaluate(() => {
            return {
                name: document.querySelector('.pdp-title')?.innerText.trim() || 'N/A',
                brand: document.querySelector('.pdp-brand')?.innerText.trim() || 'N/A',
                price: document.querySelector('.pdp-price')?.innerText.trim() || 'N/A',
                description: document.querySelector('.pdp-productDescriptorsContainer')?.innerText.trim() || 'N/A',
                imageUrl: document.querySelector('.image-grid-image')?.src || '',
            };
        })
    }
    catch(error){
        console.error(error);

    }
}

        

app.post("/analyze", async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        // Fetch product details first
        const fproductDetails = await FgetProductDetails(url);

        // Then fetch reviews
        const reviews = await getFlipkartReviews(url);

        // Use fproductDetails for AI feedback
        const aiFeedback = await getAIProductFeedback(reviews, fproductDetails.faverageScore);

        const freviewCount = reviews.length;
        let fpositiveReviews = 0;
        let fnegativeReviews = 0;
        let fneutralReviews = 0;

        reviews.forEach(review => {
            const sentiment = sentimentAnalyzer.analyze(review);
            if (sentiment.score > 0) fpositiveReviews++;
            else if (sentiment.score < 0) fnegativeReviews++;
            else fneutralReviews++;
        });

        const fpositiveScore = reviews.reduce((acc, review) => 
            sentimentAnalyzer.analyze(review).score > 0 ? acc + sentimentAnalyzer.analyze(review).score : acc, 0);
        const fnegativeScore = Math.abs(reviews.reduce((acc, review) => 
            sentimentAnalyzer.analyze(review).score < 0 ? acc + sentimentAnalyzer.analyze(review).score : acc, 0));

        res.json({
            fproductDetails,
            fsentimentData: {
                positive: fpositiveReviews,
                neutral: fneutralReviews,
                negative: fnegativeReviews
            },
            fsentimentScores: {
                positive: fpositiveScore,
                negative: fnegativeScore
            },
            freviewCount,
            aiFeedback
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Failed to analyze the Flipkart URL", details: error.message });
    }
});
app.post("/analyzemyntra", async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        // Fetch product details first
        const mproductDetails = await  getMyntraProductDetails(url);

        // Then fetch reviews
        const reviews = await getMyntraReviews(url);

        // Use fproductDetails for AI feedback
        const aiFeedback = await getAIProductFeedback(reviews, mproductDetails.faverageScore);

        const freviewCount = reviews.length;
        let fpositiveReviews = 0;
        let fnegativeReviews = 0;
        let fneutralReviews = 0;

        reviews.forEach(review => {
            const sentiment = sentimentAnalyzer.analyze(review);
            if (sentiment.score > 0) fpositiveReviews++;
            else if (sentiment.score < 0) fnegativeReviews++;
            else fneutralReviews++;
        });

        const fpositiveScore = reviews.reduce((acc, review) => 
            sentimentAnalyzer.analyze(review).score > 0 ? acc + sentimentAnalyzer.analyze(review).score : acc, 0);
        const fnegativeScore = Math.abs(reviews.reduce((acc, review) => 
            sentimentAnalyzer.analyze(review).score < 0 ? acc + sentimentAnalyzer.analyze(review).score : acc, 0));

        res.json({
            mproductDetails,
            fsentimentData: {
                positive: fpositiveReviews,
                neutral: fneutralReviews,
                negative: fnegativeReviews
            },
            fsentimentScores: {
                positive: fpositiveScore,
                negative: fnegativeScore
            },
            freviewCount,
            aiFeedback
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Failed to analyze the myntra URL", details: error.message });
    }
});
app.post("/analyzeFlipkart", async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        // Fetch product details first
        const fproductDetails = await FgetProductDetails(url);

        // Then fetch reviews
        const reviews = await getFlipkartReviews(url);

        // Use fproductDetails for AI feedback
        const aiFeedback = await getAIProductFeedback(reviews, fproductDetails.faverageScore);

        const freviewCount = reviews.length;
        let fpositiveReviews = 0;
        let fnegativeReviews = 0;
        let fneutralReviews = 0;

        reviews.forEach(review => {
            const sentiment = sentimentAnalyzer.analyze(review);
            if (sentiment.score > 0) fpositiveReviews++;
            else if (sentiment.score < 0) fnegativeReviews++;
            else fneutralReviews++;
        });

        const fpositiveScore = reviews.reduce((acc, review) => 
            sentimentAnalyzer.analyze(review).score > 0 ? acc + sentimentAnalyzer.analyze(review).score : acc, 0);
        const fnegativeScore = Math.abs(reviews.reduce((acc, review) => 
            sentimentAnalyzer.analyze(review).score < 0 ? acc + sentimentAnalyzer.analyze(review).score : acc, 0));

        res.json({
            fproductDetails,
            fsentimentData: {
                positive: fpositiveReviews,
                neutral: fneutralReviews,
                negative: fnegativeReviews
            },
            fsentimentScores: {
                positive: fpositiveScore,
                negative: fnegativeScore
            },
            freviewCount,
            aiFeedback
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Failed to analyze the Flipkart URL", details: error.message });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
