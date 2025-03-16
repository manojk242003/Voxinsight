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

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function getProductDetails(url) {
    try {
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
    } catch (error) {
        console.error('Error fetching product details:', error);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response headers:', error.response.headers);
        }
        // Return default values instead of null
        return {
            productName: "Product Not Found",
            productImage: "",
            ratingDistribution: {
                '5 Stars': 0,
                '4 Stars': 0,
                '3 Stars': 0,
                '2 Stars': 0,
                '1 Star': 0
            },
            totalRatings: 0,
            averageScore: "0.0"
        };
    }
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

app.post("/analyze", async (req, res) => {
    try {
        const { url, platform } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        let productDetails;
        let maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                productDetails = await getProductDetails(url);
                break;
            } catch (error) {
                retryCount++;
                console.error(`Attempt ${retryCount}/${maxRetries} failed:`, error.message);
                
                if (retryCount === maxRetries) {
                    console.error(`Error fetching ${platform} product details after ${maxRetries} attempts:`, error);
                    return res.status(500).json({
                        error: `Failed to fetch ${platform} product details after ${maxRetries} attempts`,
                        details: error.message,
                        productDetails: {
                            productName: "Product Not Found",
                            productImage: "",
                            ratingDistribution: {
                                '5 Stars': 0,
                                '4 Stars': 0,
                                '3 Stars': 0,
                                '2 Stars': 0,
                                '1 Star': 0
                            },
                            totalRatings: 0,
                            averageScore: "0.0"
                        },
                        sentimentData: {
                            positive: 0,
                            neutral: 0,
                            negative: 0
                        },
                        sentimentScores: {
                            positive: 0,
                            negative: 0
                        },
                        totalReviews: 0
                    });
                }

                // Wait before retrying with exponential backoff
                const backoffDelay = Math.min(1000 * (2 ** retryCount), 10000);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
        }

        if (!productDetails) {
            throw new Error('Failed to fetch product details');
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };

        let response;
        try {
            response = await instance.get(url, { headers });
        } catch (error) {
            console.error('Error fetching reviews:', error);
            // Return product details without reviews
            return res.json({
                productDetails,
                sentimentData: {
                    positive: 0,
                    neutral: 0,
                    negative: 0
                },
                sentimentScores: {
                    positive: 0,
                    negative: 0
                },
                totalReviews: productDetails.totalRatings
            });
        }

        const $ = cheerio.load(response.data);
        
        let reviewCount = 0;
        let positiveReviews = 0;
        let negativeReviews = 0;
        let neutralReviews = 0;
        let reviews = [];

        $('.review').each((_, review) => {
            const reviewText = $(review).find('.review-text').text().trim();
            const ratingText = $(review).find('.review-rating').text().trim();
            const rating = parseInt(ratingText) || 3;

            const sentiment = sentimentAnalyzer.analyze(reviewText);
            
            reviews.push({
                text: reviewText,
                rating: rating,
                sentiment: sentiment.score
            });

            reviewCount++;
            if (sentiment.score > 0) positiveReviews++;
            else if (sentiment.score < 0) negativeReviews++;
            else neutralReviews++;
        });

        // If no reviews found, use the product details rating distribution
        if (reviewCount === 0) {
            reviewCount = productDetails.totalRatings;
            // Calculate sentiment distribution based on rating distribution
            const totalPositiveRatings = productDetails.ratingDistribution['5 Stars'] + productDetails.ratingDistribution['4 Stars'];
            const totalNeutralRatings = productDetails.ratingDistribution['3 Stars'];
            const totalNegativeRatings = productDetails.ratingDistribution['2 Stars'] + productDetails.ratingDistribution['1 Star'];
            
            const total = totalPositiveRatings + totalNeutralRatings + totalNegativeRatings;
            if (total > 0) {
                positiveReviews = Math.round((totalPositiveRatings / total) * reviewCount);
                neutralReviews = Math.round((totalNeutralRatings / total) * reviewCount);
                negativeReviews = reviewCount - positiveReviews - neutralReviews;
            }
            
            // Generate sample sentiment scores
            reviews = [
                { sentiment: 0.8, count: positiveReviews },
                { sentiment: 0.0, count: neutralReviews },
                { sentiment: -0.7, count: negativeReviews }
            ];
        }

        const positiveScore = reviews.reduce((acc, review) => 
            review.sentiment > 0 ? acc + (review.sentiment * (review.count || 1)) : acc, 0);
        const negativeScore = Math.abs(reviews.reduce((acc, review) => 
            review.sentiment < 0 ? acc + (review.sentiment * (review.count || 1)) : acc, 0));

        const reviewsText = reviews.map(review => review.text);
        const aiFeedback = await getAIProductFeedback(reviewsText, productDetails.averageScore);

        res.json({
            productDetails,
            sentimentData: {
                positive: positiveReviews,
                neutral: neutralReviews,
                negative: negativeReviews
            },
            sentimentScores: {
                positive: positiveScore,
                negative: negativeScore
            },
            totalReviews: reviewCount,
            aiFeedback
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: "Failed to analyze the URL",
            details: error.message,
            productDetails: {
                productName: "Error Processing Request",
                productImage: "",
                ratingDistribution: {
                    '5 Stars': 0,
                    '4 Stars': 0,
                    '3 Stars': 0,
                    '2 Stars': 0,
                    '1 Star': 0
                },
                totalRatings: 0,
                averageScore: "0.0"
            },
            sentimentData: {
                positive: 0,
                neutral: 0,
                negative: 0
            },
            sentimentScores: {
                positive: 0,
                negative: 0
            },
            totalReviews: 0
        });
    }
});

app.post("/analyzeFlipkart", async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        const reviews = await getFlipkartReviews(url);
        const aiFeedback = await getAIProductFeedback(reviews, "N/A");

        res.json({
            aiFeedback,
            reviewCount: reviews.length
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
