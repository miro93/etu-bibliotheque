import { ComponentFixture, TestBed } from '@angular/core/testing';
import {Router} from '@angular/router';
import {of, throwError} from 'rxjs';

import { RegisterComponent } from './register.component';
import { UserService } from '../../core/service/user.service';

describe('RegisterComponent', () => {
  const user = {firstName: 'John', lastName: 'Doe', login: 'login', password: 'password'};
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  const userService = {register: jest.fn()};
  const router = {navigateByUrl: jest.fn()};
  let alert: jest.SpyInstance;

  beforeEach(async () => {
    userService.register.mockReset();
    router.navigateByUrl.mockReset();
    alert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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

    expect(userService.register).not.toHaveBeenCalled();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('First Name is required');
    expect(text).toContain('Last Name is required');
    expect(text).toContain('Login is required');
    expect(text).toContain('password is required');
  });

  it('should not call the API when one field is missing', () => {
    component.registerForm.setValue({...user, password: ''});

    component.onSubmit();

    expect(userService.register).not.toHaveBeenCalled();
  });

  it('should register the user and go to /login on success', () => {
    userService.register.mockReturnValue(of(null));
    component.registerForm.setValue(user);

    component.onSubmit();

    expect(userService.register).toHaveBeenCalledWith(user);
    expect(alert).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('should alert and stay on the page when the API fails', () => {
    userService.register.mockReturnValue(throwError(() => ({error: {message: 'User with login login already exists'}})));
    component.registerForm.setValue(user);

    component.onSubmit();

    expect(alert).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should reject a blank field', () => {
    component.registerForm.setValue({...user, login: '   '});

    component.onSubmit();

    expect(userService.register).not.toHaveBeenCalled();
  });

  it('should clear the form on reset', () => {
    component.registerForm.setValue(user);
    component.submitted = true;

    component.onReset();

    expect(component.submitted).toBe(false);
    expect(component.registerForm.value)
      .toEqual({firstName: null, lastName: null, login: null, password: null});
  });
});
