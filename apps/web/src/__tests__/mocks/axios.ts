// Mock axios for testing without MSW
import axios from 'axios';

const mockAxios = axios as jest.Mocked<typeof axios>;

export const setupAxiosMocks = () => {
  // Reset all mocks before each test
  jest.clearAllMocks();
};

export const mockLoginSuccess = () => {
  mockAxios.post.mockResolvedValueOnce({
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  });
};

export const mockLoginFailure = (message = 'Invalid credentials') => {
  mockAxios.post.mockRejectedValueOnce({
    response: {
      data: { message },
      status: 401,
    },
  });
};

export const mockRegisterSuccess = () => {
  mockAxios.post.mockResolvedValueOnce({
    data: {
      user: {
        id: '2',
        email: 'newuser@example.com',
        fullName: 'New User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  });
};

export const mockRegisterFailure = (message = 'Registration failed') => {
  mockAxios.post.mockRejectedValueOnce({
    response: {
      data: { message },
      status: 409,
    },
  });
};

export const mockGetUserSuccess = () => {
  mockAxios.get.mockResolvedValueOnce({
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  });
};

export const mockRefreshTokenSuccess = () => {
  mockAxios.post.mockResolvedValueOnce({
    data: {
      accessToken: 'new-mock-access-token',
    },
  });
};
