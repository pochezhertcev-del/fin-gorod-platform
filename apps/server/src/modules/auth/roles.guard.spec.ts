import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../entities';

/**
 * Tests for RBAC guard (section 2.1, NFR-07).
 * Verifies role-based access control logic.
 */
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function buildContext(user: { role: UserRole } | null): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  }

  it('allows access when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = buildContext({ role: UserRole.STUDENT });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user role matches required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TEACHER]);
    const ctx = buildContext({ role: UserRole.TEACHER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user role does not match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = buildContext({ role: UserRole.STUDENT });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows access when user role is one of multiple required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.PARENT, UserRole.TEACHER]);
    const ctx = buildContext({ role: UserRole.PARENT });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user is missing from request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = buildContext(null);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('student cannot access teacher-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TEACHER]);
    const ctx = buildContext({ role: UserRole.STUDENT });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('parent cannot access admin-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = buildContext({ role: UserRole.PARENT });
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
