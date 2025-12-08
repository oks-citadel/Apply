/**
 * User test fixtures
 * Provides test data for user-related tests
 */

export interface UserFixture {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export const testUsers: UserFixture[] = [
  {
    email: 'test.user@jobpilot.test',
    password: 'Test@1234',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  },
  {
    email: 'john.doe@jobpilot.test',
    password: 'SecurePass@123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
  },
  {
    email: 'jane.smith@jobpilot.test',
    password: 'StrongPass@456',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'user',
  },
  {
    email: 'admin@jobpilot.test',
    password: 'Admin@9876',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
];

export const getUserByEmail = (email: string): UserFixture | undefined => {
  return testUsers.find(u => u.email === email);
};

export const getTestUser = (index: number = 0): UserFixture => {
  return testUsers[index] || testUsers[0];
};

export const createUserPayload = (overrides?: Partial<UserFixture>): UserFixture => {
  const baseUser = {
    email: `user.${Date.now()}@jobpilot.test`,
    password: 'Test@1234',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  };

  return { ...baseUser, ...overrides };
};
