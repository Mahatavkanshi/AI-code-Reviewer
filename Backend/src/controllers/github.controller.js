const axios = require('axios');
const GitHubService = require('../services/github.service');

// In-memory token storage (in production, use database)
const githubTokens = new Map();

// Store GitHub token for a user
const storeToken = (userId, token) => {
  githubTokens.set(userId, {
    token,
    createdAt: new Date(),
  });
};

// Get GitHub token for a user
const getToken = (userId) => {
  return githubTokens.get(userId)?.token;
};

// Check if user is connected to GitHub
const isConnected = (userId) => {
  return githubTokens.has(userId);
};

// Disconnect GitHub
const disconnect = (userId) => {
  githubTokens.delete(userId);
};

// Get GitHub OAuth URL
exports.getAuthUrl = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/github/auth/callback`;
  
  const scope = 'repo read:user read:org';
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  
  res.json({ authUrl });
};

// Handle GitHub OAuth callback
exports.handleCallback = async (req, res) => {
  const { code } = req.query;
  const userId = req.user?.id || 'anonymous'; // In production, use actual user ID
  
  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: {
        Accept: 'application/json',
      },
    });
    
    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      return res.status(400).json({ message: 'Failed to obtain access token' });
    }
    
    // Store the token
    storeToken(userId, access_token);
    
    // Redirect to frontend with success
    res.redirect('http://localhost:5173/dashboard?github_connected=true');
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect('http://localhost:5173/dashboard?github_error=true');
  }
};

// Check GitHub connection status
exports.getStatus = (req, res) => {
  const userId = req.user?.id || 'anonymous';
  
  res.json({
    connected: isConnected(userId),
  });
};

// Disconnect GitHub
exports.disconnect = (req, res) => {
  const userId = req.user?.id || 'anonymous';
  disconnect(userId);
  
  res.json({ message: 'GitHub disconnected successfully' });
};

// Get GitHub user info
exports.getUser = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const user = await githubService.getUser();
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get repositories
exports.getRepositories = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { page = 1, perPage = 30 } = req.query;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const repos = await githubService.getRepositories(parseInt(page), parseInt(perPage));
    
    res.json(repos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get pull requests
exports.getPullRequests = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo, state = 'open', page = 1, perPage = 30 } = req.query;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  if (!owner || !repo) {
    return res.status(400).json({ message: 'Owner and repo are required' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const prs = await githubService.getPullRequests(owner, repo, state, parseInt(page), parseInt(perPage));
    
    res.json(prs);
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get PR files
exports.getPullRequestFiles = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo, pullNumber } = req.params;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const files = await githubService.getPullRequestFiles(owner, repo, parseInt(pullNumber));
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching PR files:', error);
    res.status(500).json({ message: error.message });
  }
};

// Review PR with AI
exports.reviewPullRequest = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo, pullNumber } = req.params;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const aiService = require('../services/ai.service');
    
    // Get PR files
    const files = await githubService.getPullRequestFiles(owner, repo, parseInt(pullNumber));
    
    // Get content of changed files
    const reviews = [];
    
    for (const file of files) {
      if (file.status === 'removed' || !file.patch) continue;
      
      // Get the actual file content
      try {
        const fileData = await githubService.getFileContent(
          owner,
          repo,
          file.filename,
          `refs/pull/${pullNumber}/head`
        );
        
        // Review the code
        const review = await aiService(fileData.content);
        
        // Parse review to get structured data
        let reviewData;
        try {
          const jsonMatch = review.match(/```json\s*([\s\S]*?)\s*```/) || 
                            review.match(/```\s*([\s\S]*?)\s*```/) ||
                            [null, review];
          const jsonContent = jsonMatch[1] || review;
          reviewData = JSON.parse(jsonContent);
        } catch (e) {
          reviewData = {
            review: review,
            improvedCode: fileData.content
          };
        }
        
        reviews.push({
          file: file.filename,
          review: reviewData.review || review,
          improvedCode: reviewData.improvedCode || fileData.content,
          originalCode: fileData.content,
        });
      } catch (fileError) {
        console.error(`Error processing file ${file.filename}:`, fileError);
      }
    }
    
    res.json({
      pullRequest: `${owner}/${repo}#${pullNumber}`,
      filesReviewed: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Error reviewing pull request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Post review comment
exports.postReviewComment = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo, pullNumber } = req.params;
  const { commitId, path, line, body } = req.body;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  if (!commitId || !path || !line || !body) {
    return res.status(400).json({ 
      message: 'commitId, path, line, and body are required' 
    });
  }
  
  try {
    const githubService = new GitHubService(token);
    const comment = await githubService.createReviewComment(
      owner,
      repo,
      parseInt(pullNumber),
      commitId,
      path,
      parseInt(line),
      body
    );
    
    res.json(comment);
  } catch (error) {
    console.error('Error posting review comment:', error);
    res.status(500).json({ message: error.message });
  }
};

// Post PR review
exports.postPullRequestReview = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo, pullNumber } = req.params;
  const { body, event, comments } = req.body;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  if (!body) {
    return res.status(400).json({ message: 'Review body is required' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const review = await githubService.createPullRequestReview(
      owner,
      repo,
      parseInt(pullNumber),
      {
        body,
        event: event || 'COMMENT',
        comments: comments || [],
      }
    );
    
    res.json(review);
  } catch (error) {
    console.error('Error posting PR review:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get repository contents (file tree)
exports.getRepoContents = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo } = req.params;
  const { path = '', ref = 'main' } = req.query;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const contents = await githubService.getRepoContents(owner, repo, path, ref);
    
    res.json(contents);
  } catch (error) {
    console.error('Error fetching repo contents:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get file content
exports.getFileContent = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo } = req.params;
  const { path, ref = 'main' } = req.query;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  if (!path) {
    return res.status(400).json({ message: 'File path is required' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const fileData = await githubService.getFileContent(owner, repo, path, ref);
    
    res.json(fileData);
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new branch
exports.createBranch = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo } = req.params;
  const { branchName, baseBranch } = req.body;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  if (!branchName) {
    return res.status(400).json({ message: 'Branch name is required' });
  }
  
  try {
    const githubService = new GitHubService(token);
    
    // Get default branch if not provided
    let base = baseBranch;
    if (!base) {
      base = await githubService.getDefaultBranch(owner, repo);
    }
    
    const branch = await githubService.createBranch(owner, repo, branchName, base);
    
    res.json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update file and commit
exports.updateFile = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo } = req.params;
  const { path, content, message, branch, sha } = req.body;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  if (!path || !content || !message || !branch || !sha) {
    return res.status(400).json({ 
      message: 'path, content, message, branch, and sha are required' 
    });
  }
  
  try {
    const githubService = new GitHubService(token);
    const result = await githubService.updateFile(
      owner,
      repo,
      path,
      content,
      message,
      branch,
      sha
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create pull request
exports.createPullRequest = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo } = req.params;
  const { title, body, head, base } = req.body;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  if (!title || !head || !base) {
    return res.status(400).json({ 
      message: 'title, head, and base are required' 
    });
  }
  
  try {
    const githubService = new GitHubService(token);
    const pr = await githubService.createPullRequest(
      owner,
      repo,
      title,
      body || '',
      head,
      base
    );
    
    res.json(pr);
  } catch (error) {
    console.error('Error creating pull request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get default branch
exports.getDefaultBranch = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo } = req.params;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const defaultBranch = await githubService.getDefaultBranch(owner, repo);
    
    res.json({ defaultBranch });
  } catch (error) {
    console.error('Error fetching default branch:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get branches
exports.getBranches = async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const token = getToken(userId);
  const { owner, repo } = req.params;
  
  if (!token) {
    return res.status(401).json({ message: 'GitHub not connected' });
  }
  
  try {
    const githubService = new GitHubService(token);
    const branches = await githubService.getBranches(owner, repo);
    
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ message: error.message });
  }
};
