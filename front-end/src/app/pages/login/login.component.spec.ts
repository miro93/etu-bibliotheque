import { ComponentFixture, TestBed } from '@angular/core/testing';
import {Router} from '@angular/router';
import {of, throwError} from 'rxjs';

import { LoginComponent } from './login.component';
import {UserService} from '../../core/service/user.service';
import {AuthService} from '../../core/service/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  const userService = {login: jest.fn()};
  const router = {navigateByUrl: jest.fn()};
  let alert: jest.SpyInstance;

  beforeEach(async () => {
    sessionStorage.clear();
    userService.login.mockReset();
    router.navigateByUrl.mockReset();
    alert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {provide: UserService, useValue: userService},
        {provide: Router, useValue: router},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => alert.mockRestore());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show required errors and not call the API when the form is empty', () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(userService.login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Login is required');
    expect(fixture.nativeElement.textContent).toContain('password is required');
  });

  it('should store the token and go to /students on success', () => {
    userService.login.mockReturnValue(of({token: 'jwt'}));
    component.loginForm.setValue({login: 'login', password: 'password'});

    component.onSubmit();

    expect(userService.login).toHaveBeenCalledWith({login: 'login', password: 'password'});
    expect(TestBed.inject(AuthService).getToken()).toBe('jwt');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/students');
  });

  it('should alert the API message and stay on the page on error', () => {
    userService.login.mockReturnValue(throwError(() => ({error: {message: 'Invalid credentials'}})));
    component.loginForm.setValue({login: 'login', password: 'wrong'});

    component.onSubmit();

    expect(alert).toHaveBeenCalledWith(expect.stringContaining('Invalid credentials'));
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should clear the form on reset', () => {
    component.loginForm.setValue({login: 'login', password: 'password'});
    component.submitted = true;

    component.onReset();

    expect(component.submitted).toBe(false);
    expect(component.loginForm.value).toEqual({login: null, password: null});
  });
});
