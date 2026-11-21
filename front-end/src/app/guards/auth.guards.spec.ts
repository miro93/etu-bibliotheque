import { TestBed } from '@angular/core/testing';
import {Router} from '@angular/router';

import {AuthGuard} from './auth.guards';
import {AuthService} from '../core/service/auth.service';

describe('AuthGuard', () => {
  const router = {navigateByUrl: jest.fn().mockResolvedValue(true)};

  beforeEach(() => {
    sessionStorage.clear();
    router.navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [{provide: Router, useValue: router}]
    });
  });

  it('should redirect to /login when not authenticated', async () => {
    const allowed = await TestBed.runInInjectionContext(AuthGuard);

    expect(allowed).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('should allow navigation when authenticated', async () => {
    TestBed.inject(AuthService).login('jwt');

    const allowed = await TestBed.runInInjectionContext(AuthGuard);

    expect(allowed).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
