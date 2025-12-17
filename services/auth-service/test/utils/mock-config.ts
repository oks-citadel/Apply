export const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      'security.maxLoginAttempts': 5,
      'security.lockoutDuration': 900,
      'security.bcryptRounds': 10,
      'jwt.accessTokenExpiresIn': '15m',
      'jwt.refreshTokenExpiresIn': '7d',
      'jwt.secret': 'test-secret',
      'jwt.issuer': 'applyforus-test',
      'jwt.audience': 'applyforus-api-test',
      'email.verificationExpiresIn': 86400,
      'email.passwordResetExpiresIn': 3600,
      'redis.host': 'localhost',
      'redis.port': 6379,
      'database.type': 'postgres',
      'database.host': 'localhost',
      'database.port': 5432,
      'database.username': 'test',
      'database.password': 'test',
      'database.database': 'test_db',
    };

    return config[key] !== undefined ? config[key] : defaultValue;
  }),
};

export const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
  verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-id', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
};

export const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByProviderId: jest.fn(),
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  validatePassword: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  resetLoginAttempts: jest.fn(),
  updateLastLogin: jest.fn(),
  updateRefreshToken: jest.fn(),
  setPasswordResetToken: jest.fn(),
  setEmailVerificationToken: jest.fn(),
  verifyEmail: jest.fn(),
  resetPassword: jest.fn(),
  updateMfaSecret: jest.fn(),
  enableMfa: jest.fn(),
  disableMfa: jest.fn(),
};

export const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendEmail: jest.fn().mockResolvedValue(undefined),
  resendVerificationEmail: jest.fn().mockResolvedValue(undefined),
};

export const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
  })),
};
