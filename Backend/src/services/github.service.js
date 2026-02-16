const { Octokit } = require('@octokit/rest');

class GitHubService {
  constructor(accessToken) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  // Get authenticated user info
  async getUser() {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return {
        login: data.login,
        id: data.id,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        name: data.name,
        email: data.email,
      };
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
      throw new Error('Failed to fetch GitHub user information');
    }
  }

  // Get user's repositories
  async getRepositories(page = 1, perPage = 30) {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        direction: 'desc',
        page,
        per_page: perPage,
      });

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  // Get pull requests for a repository
  async getPullRequests(owner, repo, state = 'open', page = 1, perPage = 30) {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state,
        page,
        per_page: perPage,
      });

      return data.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        html_url: pr.html_url,
        user: {
          login: pr.user.login,
          avatar_url: pr.user.avatar_url,
        },
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        additions: pr.additions,
        deletions: pr.deletions,
        changed_files: pr.changed_files,
      }));
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      throw new Error('Failed to fetch pull requests');
    }
  }

  // Get files changed in a pull request
  async getPullRequestFiles(owner, repo, pullNumber) {
    try {
      const { data } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return data.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        sha: file.sha,
      }));
    } catch (error) {
      console.error('Error fetching PR files:', error);
      throw new Error('Failed to fetch pull request files');
    }
  }

  // Get the content of a file
  async getFileContent(owner, repo, path, ref) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (data.type !== 'file') {
        throw new Error('Path is not a file');
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        content,
        sha: data.sha,
        size: data.size,
      };
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw new Error('Failed to fetch file content');
    }
  }

  // Create a review comment on a pull request
  async createReviewComment(owner, repo, pullNumber, commitId, path, line, body) {
    try {
      const { data } = await this.octokit.pulls.createReviewComment({
        owner,
        repo,
        pull_number: pullNumber,
        commit_id: commitId,
        path,
        line,
        body,
      });

      return {
        id: data.id,
        html_url: data.html_url,
        body: data.body,
        path: data.path,
        line: data.line,
      };
    } catch (error) {
      console.error('Error creating review comment:', error);
      throw new Error('Failed to create review comment');
    }
  }

  // Create a review on a pull request
  async createPullRequestReview(owner, repo, pullNumber, reviewData) {
    try {
      const { data } = await this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        body: reviewData.body,
        event: reviewData.event || 'COMMENT', // APPROVE, REQUEST_CHANGES, COMMENT
        comments: reviewData.comments || [],
      });

      return {
        id: data.id,
        html_url: data.html_url,
        state: data.state,
        body: data.body,
      };
    } catch (error) {
      console.error('Error creating PR review:', error);
      throw new Error('Failed to create pull request review');
    }
  }

  // Submit a review (approve/request changes/comment)
  async submitReview(owner, repo, pullNumber, reviewId, event, body) {
    try {
      const { data } = await this.octokit.pulls.submitReview({
        owner,
        repo,
        pull_number: pullNumber,
        review_id: reviewId,
        event,
        body,
      });

      return {
        id: data.id,
        state: data.state,
        html_url: data.html_url,
      };
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error('Failed to submit review');
    }
  }

  // List comments on a pull request
  async getPullRequestComments(owner, repo, pullNumber) {
    try {
      const { data } = await this.octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return data.map(comment => ({
        id: comment.id,
        body: comment.body,
        path: comment.path,
        line: comment.line,
        user: {
          login: comment.user.login,
          avatar_url: comment.user.avatar_url,
        },
        created_at: comment.created_at,
        html_url: comment.html_url,
      }));
    } catch (error) {
      console.error('Error fetching PR comments:', error);
      throw new Error('Failed to fetch pull request comments');
    }
  }

  // Search repositories
  async searchRepositories(query, page = 1, perPage = 30) {
    try {
      const { data } = await this.octokit.search.repos({
        q: query,
        page,
        per_page: perPage,
      });

      return {
        total_count: data.total_count,
        items: data.items.map(repo => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
        })),
      };
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw new Error('Failed to search repositories');
    }
  }

  // Get repository contents (file tree)
  async getRepoContents(owner, repo, path = '', ref = 'main') {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      // Handle both single file and directory
      if (Array.isArray(data)) {
        // It's a directory
        return data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type, // 'file' or 'dir'
          sha: item.sha,
          size: item.size,
          html_url: item.html_url,
          download_url: item.download_url,
        }));
      } else {
        // It's a single file
        return [{
          name: data.name,
          path: data.path,
          type: data.type,
          sha: data.sha,
          size: data.size,
          html_url: data.html_url,
          download_url: data.download_url,
        }];
      }
    } catch (error) {
      console.error('Error fetching repo contents:', error);
      throw new Error('Failed to fetch repository contents');
    }
  }

  // Get default branch
  async getDefaultBranch(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return data.default_branch;
    } catch (error) {
      console.error('Error fetching default branch:', error);
      return 'main';
    }
  }

  // Create a new branch
  async createBranch(owner, repo, newBranchName, baseBranch) {
    try {
      // Get the SHA of the base branch
      const { data: baseRef } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      });

      // Create new branch
      const { data } = await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranchName}`,
        sha: baseRef.object.sha,
      });

      return {
        ref: data.ref,
        sha: data.object.sha,
      };
    } catch (error) {
      console.error('Error creating branch:', error);
      throw new Error('Failed to create branch');
    }
  }

  // Update file content (commit)
  async updateFile(owner, repo, path, content, message, branch, sha) {
    try {
      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha,
      });

      return {
        content: data.content,
        commit: data.commit,
      };
    } catch (error) {
      console.error('Error updating file:', error);
      throw new Error('Failed to update file');
    }
  }

  // Create a pull request
  async createPullRequest(owner, repo, title, body, head, base) {
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
      });

      return {
        number: data.number,
        html_url: data.html_url,
        state: data.state,
        title: data.title,
      };
    } catch (error) {
      console.error('Error creating pull request:', error);
      throw new Error('Failed to create pull request');
    }
  }

  // Get repository branches
  async getBranches(owner, repo) {
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo,
      });

      return data.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
      }));
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw new Error('Failed to fetch branches');
    }
  }
}

module.exports = GitHubService;
