import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {MaterialModule} from '../../shared/material.module';
import {StudentService} from '../../core/service/student.service';
import {Student} from '../../core/models/Student';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {StudentDialogComponent} from '../../dialogs/student.dialog.ts/student.dialog.component';

@Component({
  selector: 'app-students',
  imports: [MaterialModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {

  private readonly studentService = inject(StudentService)
  readonly dataSource = new MatTableDataSource<Student>();
  readonly studentsTableColumns = Object.freeze(["firstName", "lastName", "email"]);

  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  constructor(private readonly router: Router, public dialog: MatDialog) {
    // tri insensible à la casse (par défaut "martin" passerait après "Zidane")
    this.dataSource.sortingDataAccessor = (student, column) => String(student[column as keyof Student]).toLowerCase();
  }

  ngOnInit(): void {
    this.loadStudents();
  }

  private loadStudents(): void {
    this.studentService.all()
      .subscribe({
        next: result => {
          this.dataSource.data = result;
        }
        , error: error => {
          if (error.status === 401) {
            void this.router.navigateByUrl('/login');
          }
        }
      })
    ;
  }

  // sans étudiant : le dialogue s'ouvre en mode création
  openStudentDialog(student?: Student): void {
    const dialogRef = this.dialog.open(StudentDialogComponent, {
      height: '400px',
      width: '600px',
      data: {student}
    });

    dialogRef.afterClosed().subscribe(changed => {
      if (changed) {
        this.loadStudents();
      }
    });
  }
}
