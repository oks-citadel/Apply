import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { IS_PUBLIC_KEY } from '../../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../jwt-auth.guard';

import type { ExecutionContext} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const mockContext = createMockExecutionContext();
      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [mockContext.getHandler(), mockContext.getClass()],
      );
    });

    it('should call parent canActivate for protected routes', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const mockContext = createMockExecutionContext();
      const parentCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      parentCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(mockContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
      expect(parentCanActivateSpy).toHaveBeenCalled();
    });

    it('should check both handler and class metadata', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const mockContext = createMockExecutionContext();
      const handler = mockContext.getHandler();
      const classRef = mockContext.getClass();

      guard.canActivate(mockContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [handler, classRef],
      );
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication succeeds', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not provided', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        'Unauthorized access',
      );
    });

    it('should throw error when error is provided', () => {
      const mockError = new Error('JWT expired');

      expect(() => guard.handleRequest(mockError, null, null)).toThrow(
        mockError,
      );
    });

    it('should prioritize error over missing user', () => {
      const mockError = new UnauthorizedException('Custom error');

      expect(() => guard.handleRequest(mockError, null, null)).toThrow(
        mockError,
      );
    });

    it('should handle user object with undefined', () => {
      expect(() => guard.handleRequest(null, undefined, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should handle info parameter', () => {
      const mockUser = { id: 'user-1' };
      const mockInfo = { message: 'JWT valid' };

      const result = guard.handleRequest(null, mockUser, mockInfo);

      expect(result).toEqual(mockUser);
    });
  });
});

function createMockExecutionContext(): ExecutionContext {
  const mockRequest: { headers: { authorization: string }; user: any } = {
    headers: {
      authorization: 'Bearer token',
    },
    user: null,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => ({}),
      getNext: () => jest.fn(),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;
}
