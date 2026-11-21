import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {notBlank} from '../../shared/not-blank.validator';
import {CommonModule} from '@angular/common';
import {MaterialModule} from '../../shared/material.module';
import {Login} from '../../core/models/Login';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {UserService} from '../../core/service/user.service';
import {AuthService} from '../../core/service/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, MaterialModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  loginForm: FormGroup = new FormGroup({});
  submitted: boolean = false;

  constructor(private readonly router: Router) {
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group(
      {
        login: ['', notBlank],
        password: ['', notBlank]
      },
    );
  }

  get form() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    const login: Login = {
      login: this.loginForm.get('login')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.userService.login(login)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
          next: jwtToken => {
            alert('SUCCESS!! :-)');
            this.authService.login(jwtToken.token);
            void this.router.navigateByUrl('/students');
          },
          error: err => {
            alert('ERROR!! ' + err.error?.message + ' :-)');
          }
        }
      );
  }

  onReset(): void {
    this.submitted = false;
    this.loginForm.reset();
  }

}
