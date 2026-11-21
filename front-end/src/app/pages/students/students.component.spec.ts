import { ComponentFixture, TestBed } from '@angular/core/testing';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {of, throwError} from 'rxjs';

import { StudentsComponent } from './students.component';
import {StudentService} from '../../core/service/student.service';
import {StudentDialogComponent} from '../../dialogs/student.dialog.ts/student.dialog.component';

describe('StudentsComponent', () => {
  const students = [
    {id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@test.com'},
    {id: 2, firstName: 'Jane', lastName: 'Roe', email: 'jane.roe@test.com'},
  ];
  let component: StudentsComponent;
  let fixture: ComponentFixture<StudentsComponent>;
  const studentService = {all: jest.fn()};
  const router = {navigateByUrl: jest.fn()};
  const dialog = {open: jest.fn()};

  // closes the dialog straight away with the given result
  const dialogClosesWith = (result: unknown) => dialog.open.mockReturnValue({afterClosed: () => of(result)});

  beforeEach(async () => {
    studentService.all.mockReset().mockReturnValue(of(students));
    router.navigateByUrl.mockReset();
    dialog.open.mockReset();

    await TestBed.configureTestingModule({
      imports: [StudentsComponent],
      providers: [
        {provide: StudentService, useValue: studentService},
        {provide: Router, useValue: router},
        {provide: MatDialog, useValue: dialog},
      ]
    })
    .compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(StudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('tr[mat-row]'));

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('should display one row per student', () => {
    createComponent();

    expect(rows()).toHaveLength(2);
    expect(rows()[0].textContent).toContain('John');
    expect(rows()[0].textContent).toContain('Doe');
    expect(rows()[0].textContent).toContain('john.doe@test.com');
  });

  it('should redirect to /login when the API answers 401', () => {
    studentService.all.mockReturnValue(throwError(() => ({status: 401})));

    createComponent();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(rows()).toHaveLength(0);
  });

  it('should stay on the page on other API errors', () => {
    studentService.all.mockReturnValue(throwError(() => ({status: 500})));

    createComponent();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should open the dialog in edit mode when a row is clicked', () => {
    dialogClosesWith(undefined);
    createComponent();

    rows()[1].click();

    expect(dialog.open).toHaveBeenCalledWith(StudentDialogComponent,
      expect.objectContaining({data: {student: students[1]}}));
  });

  it('should open the dialog in creation mode from the "Ajouter" button', () => {
    dialogClosesWith(undefined);
    createComponent();

    fixture.nativeElement.querySelector('button').click();

    expect(dialog.open).toHaveBeenCalledWith(StudentDialogComponent,
      expect.objectContaining({data: {student: undefined}}));
  });

  it('should reload the list when the dialog reports a change', () => {
    dialogClosesWith(true);
    createComponent();

    component.openStudentDialog(students[0]);

    expect(studentService.all).toHaveBeenCalledTimes(2);
  });

  it('should not reload the list when the dialog is dismissed', () => {
    dialogClosesWith(undefined);
    createComponent();

    component.openStudentDialog(students[0]);

    expect(studentService.all).toHaveBeenCalledTimes(1);
  });
});
