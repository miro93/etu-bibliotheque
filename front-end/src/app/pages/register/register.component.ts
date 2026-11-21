import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {notBlank} from '../../shared/not-blank.validator';
import {CommonModule} from '@angular/common';
import {MaterialModule} from '../../shared/material.module';
import {UserService} from '../../core/service/user.service';
import {Register} from '../../core/models/Register';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, MaterialModule],
  templateUrl: './register.component.html',
  standalone: true,
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  registerForm: FormGroup = new FormGroup({});
  submitted: boolean = false;

  constructor(private readonly router: Router) {
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group(
      {
        firstName: ['', notBlank],
        lastName: ['', notBlank],
        login: ['', notBlank],
        password: ['', notBlank]
      },
    );
  }

  get form() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.registerForm.invalid) {
      return;
    }
    const registerUser: Register = {
      firstName: this.registerForm.get('firstName')?.value,
      lastName: this.registerForm.get('lastName')?.value,
      login: this.registerForm.get('login')?.value,
      password: this.registerForm.get('password')?.value
    };
    this.userService.register(registerUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
          next: () => {
            alert('SUCCESS!! :-)');
            void this.router.navigateByUrl('/login');
          },
          error: err => {
            alert('ERROR!! ' + (err.error?.message ?? err.message) + ' :-)');
          }
        }
      );
  }

  onReset(): void {
    this.submitted = false;
    this.registerForm.reset();
  }
}
