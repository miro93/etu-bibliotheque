import { TestBed } from '@angular/core/testing';

import { StudentService } from './student.service';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';

describe('StudentService', () => {
  const student = {id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@test.com'};
  let service: StudentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(StudentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should GET all students', () => {
    const next = jest.fn();

    service.all().subscribe(next);

    const req = httpMock.expectOne('/api/students');
    expect(req.request.method).toBe('GET');
    req.flush([student]);
    expect(next).toHaveBeenCalledWith([student]);
  });

  it('should POST a new student', () => {
    const {id, ...newStudent} = student;
    const next = jest.fn();

    service.create(newStudent).subscribe(next);

    const req = httpMock.expectOne('/api/students');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newStudent);
    req.flush(student);
    expect(next).toHaveBeenCalledWith(student);
  });

  it('should PUT an existing student on its id', () => {
    const next = jest.fn();

    service.update(student).subscribe(next);

    const req = httpMock.expectOne('/api/students/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(student);
    req.flush(student);
    expect(next).toHaveBeenCalledWith(student);
  });

  it('should DELETE a student by id', () => {
    const next = jest.fn();

    service.delete(1).subscribe(next);

    const req = httpMock.expectOne('/api/students/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, {status: 204, statusText: 'No Content'});
    expect(next).toHaveBeenCalled();
  });
});
