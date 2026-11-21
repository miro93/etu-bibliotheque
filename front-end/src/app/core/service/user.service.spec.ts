import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST the user to /api/register', () => {
    const user = {firstName: 'John', lastName: 'Doe', login: 'login', password: 'password'};
    const next = jest.fn();

    service.register(user).subscribe(next);

    const req = httpMock.expectOne('/api/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(user);
    req.flush(null, {status: 201, statusText: 'Created'});
    expect(next).toHaveBeenCalled();
  });

  it('should POST the credentials to /api/login and return the token', () => {
    const login = {login: 'login', password: 'password'};
    const next = jest.fn();

    service.login(login).subscribe(next);

    const req = httpMock.expectOne('/api/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(login);
    req.flush({token: 'jwt'});
    expect(next).toHaveBeenCalledWith({token: 'jwt'});
  });
});
