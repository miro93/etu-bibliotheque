import {Component, Inject, inject} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Student} from '../../core/models/Student';
import {MaterialModule} from '../../shared/material.module';
import {StudentService} from '../../core/service/student.service';
import {notBlank} from '../../shared/not-blank.validator';

export interface DialogData {
  // absent : mode création
  student?: Student;
}

@Component({
  selector: 'app-student.dialog.ts',
  imports: [MaterialModule, MatDialogModule],
  templateUrl: './student.dialog.component.html',
  styleUrl: './student.dialog.component.css'
})
export class StudentDialogComponent {
  private readonly studentService = inject(StudentService);
  private readonly formBuilder = inject(FormBuilder);
  studentForm = this.formBuilder.nonNullable.group({
    firstName: ['', notBlank],
    lastName: ['', notBlank],
    email: ['', [Validators.required, Validators.email]]
  });
  errorMessage = '';

  constructor(public dialogRef: MatDialogRef<StudentDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    if (data.student) {
      this.studentForm.patchValue(data.student);
    }
  }

  onSubmit(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const student = this.studentForm.getRawValue();
    const request = this.data.student
      ? this.studentService.update({id: this.data.student.id, ...student})
      : this.studentService.create(student);
    request.subscribe({
      next: saved => this.dialogRef.close(saved),
      // le back répond 409 quand l'email appartient déjà à un autre étudiant
      error: error => this.errorMessage = error.status === 409
        ? 'Cet email est déjà utilisé'
        : "L'enregistrement a échoué"
    });
  }

  onDeleteClick(): void {
    const student = this.data.student;
    if (!student || !confirm('Supprimer cet étudiant ?')) {
      return;
    }
    this.studentService.delete(student.id)
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => this.errorMessage = 'La suppression a échoué'
      });
  }

}
