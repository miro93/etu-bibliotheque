import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    service = TestBed.inject(AuthService);
  });

  it('should not be authenticated without token', () => {
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should store the token on login', () => {
    service.login('jwt');

    expect(sessionStorage.getItem('token')).toBe('jwt');
    expect(service.getToken()).toBe('jwt');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should remove the token on logout', () => {
    service.login('jwt');

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
