// Mock security package for testing
export const JwtAuthGuard = jest.fn().mockImplementation(() => ({
  canActivate: jest.fn().mockReturnValue(true),
}));
export const RolesGuard = jest.fn().mockImplementation(() => ({
  canActivate: jest.fn().mockReturnValue(true),
}));
export const Roles = jest.fn().mockReturnValue(() => {});
export const CurrentUser = jest.fn().mockReturnValue(() => {});
export class SecurityModule {
  static forRoot() {
    return { module: SecurityModule };
  }
}
