import {TestBed} from '@angular/core/testing';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideRouter, Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';

import {routes} from './app.routes';
import {authInterceptor} from './core/interceptor/auth.interceptor';
import {AuthService} from './core/service/auth.service';

// Real routes, guard, interceptor, services and components : only the HTTP backend is faked.
describe('App integration', () => {
  const students = [{id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@test.com'}];
  let harness: RouterTestingHarness;
  let httpMock: HttpTestingController;
  let router: Router;
  let alert: jest.SpyInstance;

  const page = (): HTMLElement => harness.routeNativeElement!;

  function fill(formControlName: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(`input[formControlName="${formControlName}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function submit(): Promise<void> {
    page().querySelector('form')!.dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();
  }

  async function settle(): Promise<void> {
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.clear();
    alert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter(routes),
      ]
    });
    harness = await RouterTestingHarness.create();
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    alert.mockRestore();
  });

  it('should send an anonymous visitor of /students to the login page', async () => {
    await harness.navigateByUrl('/students');

    expect(router.url).toBe('/login');
    httpMock.expectNone('/api/students');
  });

  it('should register then land on the login page', async () => {
    await harness.navigateByUrl('/register');
    fill('firstName', 'John');
    fill('lastName', 'Doe');
    fill('login', 'login');
    fill('password', 'password');
    await submit();

    const req = httpMock.expectOne('/api/register');
    expect(req.request.body).toEqual({firstName: 'John', lastName: 'Doe', login: 'login', password: 'password'});
    req.flush(null, {status: 201, statusText: 'Created'});
    await settle();

    expect(router.url).toBe('/login');
  });

  it('should login then list the students with the Bearer token', async () => {
    await harness.navigateByUrl('/login');
    fill('login', 'login');
    fill('password', 'password');
    await submit();

    const login = httpMock.expectOne('/api/login');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({token: 'jwt'});
    await settle();

    expect(router.url).toBe('/students');
    const list = httpMock.expectOne('/api/students');
    expect(list.request.headers.get('Authorization')).toBe('Bearer jwt');
    list.flush(students);
    await settle();

    expect(page().querySelectorAll('tr[mat-row]')).toHaveLength(1);
    expect(page().textContent).toContain('john.doe@test.com');
  });

  it('should stay on the login page when the credentials are refused', async () => {
    await harness.navigateByUrl('/login');
    fill('login', 'login');
    fill('password', 'wrong');
    await submit();

    httpMock.expectOne('/api/login')
      .flush({message: 'Invalid credentials'}, {status: 401, statusText: 'Unauthorized'});
    await settle();

    expect(router.url).toBe('/login');
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('Invalid credentials'));
  });

  it('should drop an expired session and go back to the login page', async () => {
    TestBed.inject(AuthService).login('expired-jwt');
    await harness.navigateByUrl('/students');

    httpMock.expectOne('/api/students').flush(null, {status: 401, statusText: 'Unauthorized'});
    await settle();

    expect(router.url).toBe('/login');
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
  });
});
