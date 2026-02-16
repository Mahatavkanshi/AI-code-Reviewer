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

// System instruction for code review with auto-fix generation
const SYSTEM_INSTRUCTION = `
You are an expert code reviewer with 7+ years of development experience. Your role is to analyze, review, and improve code.

IMPORTANT: You must respond with a JSON object containing TWO fields:
1. "review": A detailed markdown-formatted code review
2. "improvedCode": The complete improved/refactored code that fixes all issues

Your response format MUST be:
{
  "review": "## Overall Assessment\\n\\n[Your review here]\\n\\n## Issues Found\\n\\n### Critical\\n- Issue 1\\n- Issue 2\\n\\n### Warning\\n- Issue 3\\n\\n### Suggestion\\n- Issue 4\\n\\n## Code Improvements\\n[Suggestions]\\n\\n## Best Practices\\n[Recommendations]\\n\\n## Security Considerations\\n[If applicable]",
  "improvedCode": "// Complete improved code here\\nfunction example() {\\n  // Fixed implementation\\n}"
}

Guidelines:
- Provide detailed feedback in the review field
- The improvedCode must be complete, runnable, and production-ready
- Fix all critical and warning issues in the improvedCode
- Add comments explaining complex changes
- Ensure the improved code follows all best practices
- If no changes needed, return the original code with minor improvements

Be thorough, actionable, and professional.`;

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
            const aiResponse = data.choices[0].message.content;
            
            // Parse the JSON response
            let parsedResponse;
            try {
                // Try to extract JSON if wrapped in code blocks
                const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                                  aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                                  [null, aiResponse];
                const jsonContent = jsonMatch[1] || aiResponse;
                parsedResponse = JSON.parse(jsonContent);
            } catch (e) {
                // If JSON parsing fails, create a structured response
                console.error('Failed to parse AI response as JSON:', e);
                parsedResponse = {
                    review: aiResponse,
                    improvedCode: prompt // Return original code if parsing fails
                };
            }
            
            // Ensure both fields exist
            const result = {
                review: parsedResponse.review || aiResponse,
                improvedCode: parsedResponse.improvedCode || prompt,
                originalCode: prompt
            };
            
            // Cache the response
            setCachedResponse(prompt, result);
            
            resolve(result);
            
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
