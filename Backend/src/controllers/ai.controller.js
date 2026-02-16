const aiService = require("../services/ai.service")

module.exports.getReview = async(req,res)=>{
    const code = req.body.code;
    
    if (!code){
        return res.status(400).json({ message: "Code is required" });
    }

    try {
        const review = await aiService(code);
        res.json({ review });
    } catch (error) {
        console.error("AI Review Error:", error.message);
        
        // Check for specific error types
        if (error.message.includes('Rate limit')) {
            return res.status(429).json({ 
                message: error.message,
                retryAfter: 60
            });
        }
        
        if (error.message.includes('quota') || error.message.includes('429')) {
            return res.status(429).json({ 
                message: "API quota exceeded. Please wait a moment and try again.",
                retryAfter: 60
            });
        }
        
        res.status(500).json({ 
            message: error.message || "Failed to generate code review"
        });
    }
}