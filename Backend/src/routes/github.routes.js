const express = require('express');
const router = express.Router();
const githubController = require('../controllers/github.controller');

// GitHub OAuth routes
router.get('/auth/url', githubController.getAuthUrl);
router.get('/auth/callback', githubController.handleCallback);
router.get('/auth/status', githubController.getStatus);
router.post('/auth/disconnect', githubController.disconnect);

// GitHub user
router.get('/user', githubController.getUser);

// Repositories
router.get('/repos', githubController.getRepositories);

// Pull requests
router.get('/repos/:owner/:repo/pulls', githubController.getPullRequests);
router.get('/repos/:owner/:repo/pulls/:pullNumber/files', githubController.getPullRequestFiles);

// AI Review
router.post('/repos/:owner/:repo/pulls/:pullNumber/review', githubController.reviewPullRequest);

// Post reviews
router.post('/repos/:owner/:repo/pulls/:pullNumber/comments', githubController.postReviewComment);
router.post('/repos/:owner/:repo/pulls/:pullNumber/reviews', githubController.postPullRequestReview);

// Repository file browser
router.get('/repos/:owner/:repo/contents', githubController.getRepoContents);
router.get('/repos/:owner/:repo/file', githubController.getFileContent);

// Branch management
router.get('/repos/:owner/:repo/branches', githubController.getBranches);
router.get('/repos/:owner/:repo/default-branch', githubController.getDefaultBranch);
router.post('/repos/:owner/:repo/branches', githubController.createBranch);

// File editing and commits
router.put('/repos/:owner/:repo/contents', githubController.updateFile);

// Pull request creation
router.post('/repos/:owner/:repo/pulls', githubController.createPullRequest);

module.exports = router;
