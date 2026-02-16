const crypto = require('crypto');

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 30; // Conservative limit
let requestTimestamps = [];

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Request queue
let requestQueue = [];
let isProcessingQueue = false;

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// System instruction for code review
const SYSTEM_INSTRUCTION = `
AI System Instruction: Senior Code Reviewer (7+ years of Experience)

Role and Responsibilities:

You are an expert code reviewer with 7+ years of development experience. Your role is to analyze, review, and improve code written by developers. You focus on:
- Code Quality: ensuring clean, maintainable, and well-structured code.
- Best Practices: suggesting industry-standard coding practices.
- Efficiency and Performance: identifying areas to optimize execution time and resource usage.
- Error Detection: spotting potential bugs, security risks and logical flaws.
- Scalability: advising on how to make code adaptable for future growth.
- Readability & Maintainability: ensuring that the code is easy to understand and modify.

Guidelines for review:
1. Provide constructive feedback: be detailed yet concise, explaining why changes are needed.
2. Suggest code improvements: offer refactored versions or alternative approaches when possible.
3. Detect & fix performance bottlenecks: identify redundant operations or costly computations.
4. Ensure security compliance: look for common vulnerabilities (e.g., SQL injection, XSS, CSRF).
5. Promote consistency: ensure uniform formatting, naming conventions, and style guide adherence.
6. Follow DRY (Don't Repeat Yourself) & SOLID principles: reduce code duplication and modular design.
7. Identify unnecessary complexity: recommend simplifications when needed.
8. Verify test coverage: check if proper unit/integration tests exist and suggest improvements.
9. Ensure proper documentation: advise on adding meaningful comments and docstrings.
10. Encourage modern practices: suggest the latest frameworks, libraries, or patterns when beneficial.

Tone and approach:
- Be precise, to the point, and avoid unnecessary stuff.
- Provide real-world examples when explaining concepts.
- Assume that the developer is competent but always offer room for improvement.
- Balance strictness with encouragement: highlight strengths while pointing out weaknesses.

Output format:
Review the following code and provide:
1. Overall Assessment (brief summary)
2. Issues Found (categorized by severity: Critical, Warning, Suggestion)
3. Code Improvements (with before/after examples)
4. Best Practices Recommendations
5. Security Considerations (if applicable)

Be thorough but concise. Focus on actionable feedback.`;

// Clean old cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
        }
    }
}, 60000);

// Check rate limit
function checkRateLimit() {
    const now = Date.now();
    // Remove timestamps older than the window
    requestTimestamps = requestTimestamps.filter(timestamp => 
        now - timestamp < RATE_LIMIT_WINDOW
    );
    
    if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        const oldestRequest = requestTimestamps[0];
        const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 1000);
        throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
    }
    
    requestTimestamps.push(now);
}

// Get cached response
function getCachedResponse(prompt) {
    const hash = crypto.createHash('md5').update(prompt).digest('hex');
    const cached = cache.get(hash);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log('Returning cached response');
        return cached.data;
    }
    
    return null;
}

// Cache response
function setCachedResponse(prompt, data) {
    const hash = crypto.createHash('md5').update(prompt).digest('hex');
    cache.set(hash, {
        data,
        timestamp: Date.now()
    });
}

// Process request queue
async function processQueue() {
    if (isProcessingQueue || requestQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    while (requestQueue.length > 0) {
        const { prompt, resolve, reject } = requestQueue.shift();
        
        try {
            // Check rate limit before each request
            checkRateLimit();
            
            // Check cache first
            const cached = getCachedResponse(prompt);
            if (cached) {
                resolve(cached);
                continue;
            }
            
            // Make API call to Groq
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: SYSTEM_INSTRUCTION
                        },
                        {
                            role: 'user',
                            content: `Please review this code:\n\n${prompt}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 4096
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Groq API Error Response:', errorText);
                let errorData = {};
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // Not JSON, use text as is
                }
                const errorMessage = errorData.error?.message || errorText || `HTTP error! status: ${response.status}`;
                
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                }
                if (response.status === 401) {
                    throw new Error('Invalid API key configuration.');
                }
                if (response.status === 400) {
                    throw new Error(`Bad Request: ${errorMessage}`);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const review = data.choices[0].message.content;
            
            // Cache the response
            setCachedResponse(prompt, review);
            
            resolve(review);
            
            // Add delay between requests to avoid bursts
            if (requestQueue.length > 0) {
                await new Promise(r => setTimeout(r, 2000)); // 2 second delay
            }
        } catch (error) {
            reject(error);
        }
    }
    
    isProcessingQueue = false;
}

async function generateContent(prompt) {
    return new Promise((resolve, reject) => {
        // Check cache immediately
        const cached = getCachedResponse(prompt);
        if (cached) {
            resolve(cached);
            return;
        }
        
        // Add to queue
        requestQueue.push({ prompt, resolve, reject });
        
        // Start processing queue
        processQueue();
    });
}

module.exports = generateContent
