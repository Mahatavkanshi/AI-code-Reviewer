const pool = require('../../db');

// Save a new code review
exports.saveReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            code_snippet, 
            language, 
            ai_review, 
            improved_code,
            issues_count = 0,
            suggestions_count = 0
        } = req.body;

        // Validate required fields
        if (!code_snippet || !ai_review) {
            return res.status(400).json({ 
                success: false, 
                message: 'Code snippet and AI review are required' 
            });
        }

        // Insert review into database
        const result = await pool.query(
            `INSERT INTO code_reviews 
            (user_id, code_snippet, language, ai_review, improved_code, issues_count, suggestions_count) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [userId, code_snippet, language, ai_review, improved_code, issues_count, suggestions_count]
        );

        res.status(201).json({
            success: true,
            message: 'Review saved successfully',
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Save Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save review'
        });
    }
};

// Get all reviews for a user
exports.getUserReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;

        const result = await pool.query(
            `SELECT * FROM code_reviews 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3`,
            [userId, parseInt(limit), parseInt(offset)]
        );

        // Get total count for pagination
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM code_reviews WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            reviews: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get Reviews Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
};

// Get a single review by ID
exports.getReviewById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM code_reviews 
            WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Get Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review'
        });
    }
};

// Update review (e.g., mark fix as applied)
exports.updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { fix_applied } = req.body;

        const result = await pool.query(
            `UPDATE code_reviews 
            SET fix_applied = $1
            WHERE id = $2 AND user_id = $3
            RETURNING *`,
            [fix_applied, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Review updated successfully',
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Update Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review'
        });
    }
};

// Delete a review
exports.deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM code_reviews WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review'
        });
    }
};

// Get review statistics
exports.getReviewStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const statsResult = await pool.query(
            `SELECT 
                COUNT(*) as total_reviews,
                COUNT(CASE WHEN fix_applied = TRUE THEN 1 END) as fixes_applied,
                COALESCE(SUM(issues_count), 0) as total_issues,
                COALESCE(SUM(suggestions_count), 0) as total_suggestions,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_reviews
            FROM code_reviews 
            WHERE user_id = $1`,
            [userId]
        );

        const languageResult = await pool.query(
            `SELECT language, COUNT(*) as count 
            FROM code_reviews 
            WHERE user_id = $1 AND language IS NOT NULL
            GROUP BY language 
            ORDER BY count DESC`,
            [userId]
        );

        res.json({
            success: true,
            stats: {
                ...statsResult.rows[0],
                languages: languageResult.rows
            }
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};
