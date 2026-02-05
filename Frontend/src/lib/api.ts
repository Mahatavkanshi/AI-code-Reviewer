// API configuration and service functions

const API_BASE_URL = 'http://localhost:3000';

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
    name: string;
    email: string;
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
