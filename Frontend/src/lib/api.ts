// API configuration and service functions

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SignupData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  usernameOrEmail: string;
  password: string;
}

interface AuthResponse {
  message?: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
  };
}

interface ReviewData {
  code: string;
  language?: string;
}

// Auth API calls
export const authAPI = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    return response.json();
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },
};

// AI API calls
export const aiAPI = {
  getReview: async (data: ReviewData, token?: string): Promise<any> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/ai/get-review`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get code review');
    }

    return response.json();
  },
};

// Review History API calls
interface SaveReviewData {
  code_snippet: string;
  language?: string;
  ai_review: string;
  improved_code?: string;
  issues_count?: number;
  suggestions_count?: number;
}

interface ReviewHistory {
  id: number;
  user_id: number;
  code_snippet: string;
  language?: string;
  ai_review: string;
  improved_code?: string;
  issues_count: number;
  suggestions_count: number;
  fix_applied: boolean;
  created_at: string;
  updated_at: string;
}

export const reviewAPI = {
  // Save a review to history
  saveReview: async (data: SaveReviewData, token: string): Promise<{ success: boolean; review: ReviewHistory }> => {
    const response = await fetch(`${API_BASE_URL}/reviews/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save review');
    }

    return response.json();
  },

  // Get user's review history
  getHistory: async (token: string, limit: number = 50, offset: number = 0): Promise<{ 
    success: boolean; 
    reviews: ReviewHistory[]; 
    total: number;
    limit: number;
    offset: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/reviews/history?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch review history');
    }

    return response.json();
  },

  // Get single review by ID
  getReviewById: async (id: number, token: string): Promise<{ success: boolean; review: ReviewHistory }> => {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch review');
    }

    return response.json();
  },

  // Update review (e.g., mark fix as applied)
  updateReview: async (id: number, data: { fix_applied: boolean }, token: string): Promise<{ 
    success: boolean; 
    review: ReviewHistory 
  }> => {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update review');
    }

    return response.json();
  },

  // Delete review
  deleteReview: async (id: number, token: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete review');
    }

    return response.json();
  },

  // Get review statistics
  getStats: async (token: string): Promise<{ 
    success: boolean; 
    stats: {
      total_reviews: number;
      fixes_applied: number;
      total_issues: number;
      total_suggestions: number;
      today_reviews: number;
      languages: { language: string; count: number }[];
    }
  }> => {
    const response = await fetch(`${API_BASE_URL}/reviews/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch statistics');
    }

    return response.json();
  },
};

// Admin API calls
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface AdminReview {
  id: number;
  user_id: number;
  username: string;
  email: string;
  code_snippet: string;
  language: string;
  ai_review: string;
  issues_count: number;
  suggestions_count: number;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  totalReviews: number;
  todayReviews: number;
  recentActivity: { date: string; count: number }[];
}

export const adminAPI = {
  // Get all users
  getUsers: async (token: string): Promise<{ success: boolean; users: User[] }> => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch users');
    }

    return response.json();
  },

  // Get admin stats
  getStats: async (token: string): Promise<{ success: boolean; stats: AdminStats }> => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch stats');
    }

    return response.json();
  },

  // Get all reviews
  getAllReviews: async (token: string): Promise<{ success: boolean; reviews: AdminReview[] }> => {
    const response = await fetch(`${API_BASE_URL}/admin/reviews`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch reviews');
    }

    return response.json();
  },

  // Create new user
  createUser: async (data: { username: string; email: string; password: string; role?: string }, token: string): Promise<{ 
    success: boolean; 
    message: string;
    user: User;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    return response.json();
  },

  // Delete user
  deleteUser: async (id: number, token: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }

    return response.json();
  },

  // Change user role
  changeUserRole: async (id: number, role: string, token: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change role');
    }

    return response.json();
  },

  // Reset dashboard
  resetDashboard: async (token: string): Promise<{ success: boolean; message: string; deletedCount: number }> => {
    const response = await fetch(`${API_BASE_URL}/admin/reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset dashboard');
    }

    return response.json();
  },
};

// GitHub API calls
export const githubAPI = {
  // Get GitHub OAuth URL
  getAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response = await fetch(`${API_BASE_URL}/github/auth/url`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get GitHub auth URL');
    }
    
    return response.json();
  },

  // Check GitHub connection status
  getStatus: async (): Promise<{ connected: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/github/auth/status`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get GitHub status');
    }
    
    return response.json();
  },

  // Disconnect GitHub
  disconnect: async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/github/auth/disconnect`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to disconnect GitHub');
    }
    
    return response.json();
  },

  // Get GitHub user info
  getUser: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/github/user`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get GitHub user');
    }
    
    return response.json();
  },

  // Get repositories
  getRepositories: async (page: number = 1, perPage: number = 30): Promise<any[]> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos?page=${page}&perPage=${perPage}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get repositories');
    }
    
    return response.json();
  },

  // Get pull requests
  getPullRequests: async (
    owner: string,
    repo: string,
    state: string = 'open',
    page: number = 1,
    perPage: number = 30
  ): Promise<any[]> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/pulls?state=${state}&page=${page}&perPage=${perPage}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get pull requests');
    }
    
    return response.json();
  },

  // Get PR files
  getPullRequestFiles: async (owner: string, repo: string, pullNumber: number): Promise<any[]> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/pulls/${pullNumber}/files`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get PR files');
    }
    
    return response.json();
  },

  // Review PR with AI
  reviewPullRequest: async (owner: string, repo: string, pullNumber: number): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/pulls/${pullNumber}/review`,
      {
        method: 'POST',
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to review pull request');
    }
    
    return response.json();
  },

  // Post PR review
  postPullRequestReview: async (
    owner: string,
    repo: string,
    pullNumber: number,
    reviewData: { body: string; event?: string; comments?: any[] }
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to post PR review');
    }
    
    return response.json();
  },

  // Get repository contents (file tree)
  getRepoContents: async (owner: string, repo: string, path: string = '', ref: string = 'main'): Promise<any[]> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/contents?path=${encodeURIComponent(path)}&ref=${ref}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get repo contents');
    }
    
    return response.json();
  },

  // Get file content
  getFileContent: async (owner: string, repo: string, path: string, ref: string = 'main'): Promise<{ content: string; sha: string; size: number }> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/file?path=${encodeURIComponent(path)}&ref=${ref}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get file content');
    }
    
    return response.json();
  },

  // Create branch
  createBranch: async (owner: string, repo: string, branchName: string, baseBranch: string): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/branches`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branchName, baseBranch }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create branch');
    }
    
    return response.json();
  },

  // Update file
  updateFile: async (
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha: string
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/contents`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, content, message, branch, sha }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update file');
    }
    
    return response.json();
  },

  // Create pull request
  createPullRequest: async (
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body, head, base }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create pull request');
    }
    
    return response.json();
  },

  // Get default branch
  getDefaultBranch: async (owner: string, repo: string): Promise<{ defaultBranch: string }> => {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/default-branch`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get default branch');
    }
    
    return response.json();
  },
};
