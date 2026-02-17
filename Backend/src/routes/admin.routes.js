const express = require('express');
const router = express.Router();
const pool = require('../../db');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/auth.middleware');

// Admin middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Apply authentication and admin check to all routes
router.use(verifyToken, requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
    try {
        // Get total users
        const usersResult = await pool.query('SELECT COUNT(*) as total_users FROM users');
        
        // Get total reviews
        const reviewsResult = await pool.query('SELECT COUNT(*) as total_reviews FROM code_reviews');
        
        // Get today's reviews
        const todayResult = await pool.query(`
            SELECT COUNT(*) as today_reviews 
            FROM code_reviews 
            WHERE DATE(created_at) = CURRENT_DATE
        `);
        
        // Get recent activity (last 7 days)
        const activityResult = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM code_reviews
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);
        
        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(usersResult.rows[0].total_users),
                totalReviews: parseInt(reviewsResult.rows[0].total_reviews),
                todayReviews: parseInt(todayResult.rows[0].today_reviews),
                recentActivity: activityResult.rows
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

// Get all reviews (admin view)
router.get('/reviews', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cr.*, u.username, u.email
            FROM code_reviews cr
            JOIN users u ON cr.user_id = u.id
            ORDER BY cr.created_at DESC
        `);
        res.json({
            success: true,
            reviews: result.rows
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

// Create new user (admin only)
router.post('/users', async (req, res) => {
    try {
        const { username, email, password, role = 'user' } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }
        
        // Check if user exists
        const existing = await pool.query(
            'SELECT * FROM users WHERE username=$1 OR email=$2',
            [username, email]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
            [username, email, hashedPassword, role]
        );
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent admin from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        
        const result = await pool.query(
            'DELETE FROM users WHERE id=$1 RETURNING id, username, email',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

// Change user role
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be user or admin'
            });
        }
        
        const result = await pool.query(
            'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, username, email, role',
            [role, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: `User role updated to ${role}`,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({ success: false, message: 'Failed to change role' });
    }
});

// Reset dashboard - delete all users except admin
router.post('/reset', async (req, res) => {
    try {
        // Delete all code_reviews first (CASCADE will handle this, but let's be explicit)
        await pool.query('DELETE FROM code_reviews');
        
        // Delete all users except the current admin
        const result = await pool.query(
            'DELETE FROM users WHERE id != $1 RETURNING COUNT(*) as deleted_count',
            [req.user.id]
        );
        
        const deletedCount = result.rows[0]?.deleted_count || 0;
        
        res.json({
            success: true,
            message: `Dashboard reset successfully. Deleted ${deletedCount} users and all their reviews.`,
            deletedCount: parseInt(deletedCount)
        });
    } catch (error) {
        console.error('Reset dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset dashboard' });
    }
});

module.exports = router;
