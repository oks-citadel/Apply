// Mock for @applyforus/security package
export const SecurityService = jest.fn().mockImplementation(() => ({
  encrypt: jest.fn((data) => `encrypted_${data}`),
  decrypt: jest.fn((data) => data.replace('encrypted_', '')),
  hash: jest.fn((data) => `hashed_${data}`),
  verify: jest.fn(() => true),
}));

export const SecurityModule = {
  forRoot: jest.fn().mockReturnValue({
    module: class MockSecurityModule {},
    providers: [],
    exports: [],
  }),
};

export default {
  SecurityService,
  SecurityModule,
};
