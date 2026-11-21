import { ComponentFixture, TestBed } from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {of, throwError} from 'rxjs';

import {DialogData, StudentDialogComponent} from './student.dialog.component';
import {StudentService} from '../../core/service/student.service';

describe('StudentDialogComponent', () => {
  const student = {id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@test.com'};
  const {id, ...formValue} = student;
  let component: StudentDialogComponent;
  let fixture: ComponentFixture<StudentDialogComponent>;
  const studentService = {create: jest.fn(), update: jest.fn(), delete: jest.fn()};
  const dialogRef = {close: jest.fn()};
  let confirm: jest.SpyInstance;

  async function createComponent(data: DialogData): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [StudentDialogComponent],
      providers: [
        {provide: StudentService, useValue: studentService},
        {provide: MatDialogRef, useValue: dialogRef},
        {provide: MAT_DIALOG_DATA, useValue: data},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const text = (): string => fixture.nativeElement.textContent;

  beforeEach(() => {
    jest.resetAllMocks();
    confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => confirm.mockRestore());

  describe('creation mode', () => {
    beforeEach(() => createComponent({}));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show an empty form without delete button', () => {
      expect(text()).toContain('Nouvel étudiant');
      expect(text()).toContain('Ajouter');
      expect(text()).not.toContain('Supprimer');
      expect(component.studentForm.getRawValue()).toEqual({firstName: '', lastName: '', email: ''});
    });

    it('should not call the API when the form is invalid', () => {
      component.onSubmit();

      expect(studentService.create).not.toHaveBeenCalled();
      expect(component.studentForm.touched).toBe(true);
    });

    it('should reject an invalid email', () => {
      component.studentForm.setValue({...formValue, email: 'not-an-email'});

      component.onSubmit();

      expect(studentService.create).not.toHaveBeenCalled();
    });

    it('should create the student and close the dialog with it', () => {
      studentService.create.mockReturnValue(of(student));
      component.studentForm.setValue(formValue);

      fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

      expect(studentService.create).toHaveBeenCalledWith(formValue);
      expect(studentService.update).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith(student);
    });

    it('should explain that the email is already used on 409', () => {
      studentService.create.mockReturnValue(throwError(() => ({status: 409})));
      component.studentForm.setValue(formValue);

      component.onSubmit();
      fixture.detectChanges();

      expect(text()).toContain('Cet email est déjà utilisé');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should show a generic message on other errors', () => {
      studentService.create.mockReturnValue(throwError(() => ({status: 500})));
      component.studentForm.setValue(formValue);

      component.onSubmit();
      fixture.detectChanges();

      expect(text()).toContain("L'enregistrement a échoué");
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should not delete anything', () => {
      component.onDeleteClick();

      expect(confirm).not.toHaveBeenCalled();
      expect(studentService.delete).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    beforeEach(() => createComponent({student}));

    it('should prefill the form with the student', () => {
      expect(text()).toContain('Etudiant numéro 1');
      expect(text()).toContain('Modifier');
      expect(text()).toContain('Supprimer');
      expect(component.studentForm.getRawValue()).toEqual(formValue);
    });

    it('should update the student with its id and close the dialog', () => {
      const updated = {...student, firstName: 'Johnny'};
      studentService.update.mockReturnValue(of(updated));
      component.studentForm.patchValue({firstName: 'Johnny'});

      component.onSubmit();

      expect(studentService.update).toHaveBeenCalledWith(updated);
      expect(studentService.create).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith(updated);
    });

    it('should delete the student after confirmation', () => {
      studentService.delete.mockReturnValue(of(undefined));

      component.onDeleteClick();

      expect(confirm).toHaveBeenCalled();
      expect(studentService.delete).toHaveBeenCalledWith(1);
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should not delete the student when the confirmation is refused', () => {
      confirm.mockReturnValue(false);

      component.onDeleteClick();

      expect(studentService.delete).not.toHaveBeenCalled();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should show a message when the deletion fails', () => {
      studentService.delete.mockReturnValue(throwError(() => ({status: 500})));

      component.onDeleteClick();
      fixture.detectChanges();

      expect(text()).toContain('La suppression a échoué');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });
});
