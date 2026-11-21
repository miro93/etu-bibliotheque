import { TestBed } from '@angular/core/testing';
import {HttpClient, provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {Router} from '@angular/router';

import {authInterceptor} from './auth.interceptor';
import {AuthService} from '../service/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  const router = {navigateByUrl: jest.fn()};

  beforeEach(() => {
    sessionStorage.clear();
    router.navigateByUrl.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {provide: Router, useValue: router},
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  it('should not add the Authorization header without token', () => {
    http.get('/api/students').subscribe();

    const req = httpMock.expectOne('/api/students');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('should add the Bearer token when authenticated', () => {
    auth.login('jwt');

    http.get('/api/students').subscribe();

    const req = httpMock.expectOne('/api/students');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt');
    req.flush([]);
  });

  it.each(['/api/login', '/api/register'])('should not send the token to %s', url => {
    auth.login('expired-jwt');

    http.post(url, {}).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should logout and redirect to /login on 401', () => {
    auth.login('expired-jwt');
    const error = jest.fn();

    http.get('/api/students').subscribe({error});
    httpMock.expectOne('/api/students').flush(null, {status: 401, statusText: 'Unauthorized'});

    expect(auth.isAuthenticated()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(error).toHaveBeenCalledWith(expect.objectContaining({status: 401}));
  });

  it('should keep the session on other errors', () => {
    auth.login('jwt');
    const error = jest.fn();

    http.get('/api/students').subscribe({error});
    httpMock.expectOne('/api/students').flush(null, {status: 500, statusText: 'Server Error'});

    expect(auth.isAuthenticated()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.objectContaining({status: 500}));
  });
});
