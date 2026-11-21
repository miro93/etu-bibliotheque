package com.openclassrooms.etudiant.service;

import com.openclassrooms.etudiant.entities.Student;
import com.openclassrooms.etudiant.repository.StudentRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(SpringExtension.class)
public class StudentServiceTest {
    private static final Long ID = 1L;
    private static final String FIRST_NAME = "John";
    private static final String LAST_NAME = "Doe";
    private static final String EMAIL = "john.doe@test.com";
    @Mock
    private StudentRepository studentRepository;
    @InjectMocks
    private StudentService studentService;

    private static Student student() {
        return new Student(null, FIRST_NAME, LAST_NAME, EMAIL);
    }

    @Test
    public void test_create_null_student_throws_IllegalArgumentException() {
        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> studentService.create(null));
    }

    @Test
    public void test_create_student_with_existing_email_throws_DuplicateKeyException() {
        // GIVEN
        when(studentRepository.existsByEmail(EMAIL)).thenReturn(true);

        // THEN
        Assertions.assertThrows(DuplicateKeyException.class,
                () -> studentService.create(student()));
        verify(studentRepository, never()).save(any());
    }

    @Test
    public void test_create_student() {
        // GIVEN
        Student student = student();
        when(studentRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(studentRepository.save(student)).thenReturn(student);

        // WHEN
        Student created = studentService.create(student);

        // THEN
        verify(studentRepository).save(student);
        assertThat(created).isEqualTo(student);
    }

    @Test
    public void test_update_unknown_student_returns_empty() {
        // GIVEN
        when(studentRepository.existsById(ID)).thenReturn(false);

        // THEN
        assertThat(studentService.update(ID, student())).isEmpty();
        verify(studentRepository, never()).save(any());
    }

    @Test
    public void test_update_student_with_email_of_another_student_throws_DuplicateKeyException() {
        // GIVEN
        when(studentRepository.existsById(ID)).thenReturn(true);
        when(studentRepository.existsByEmailAndIdNot(EMAIL, ID)).thenReturn(true);

        // THEN
        Assertions.assertThrows(DuplicateKeyException.class,
                () -> studentService.update(ID, student()));
        verify(studentRepository, never()).save(any());
    }

    @Test
    public void test_update_student() {
        // GIVEN
        Student student = student();
        when(studentRepository.existsById(ID)).thenReturn(true);
        when(studentRepository.existsByEmailAndIdNot(EMAIL, ID)).thenReturn(false);
        when(studentRepository.save(student)).thenReturn(student);

        // WHEN
        studentService.update(ID, student);

        // THEN
        verify(studentRepository).save(student);
        assertThat(student.getId()).isEqualTo(ID);
    }

    @Test
    public void test_delete_unknown_student_returns_false() {
        // GIVEN
        when(studentRepository.existsById(ID)).thenReturn(false);

        // THEN
        assertThat(studentService.delete(ID)).isFalse();
        verify(studentRepository, never()).deleteById(any());
    }

    @Test
    public void test_delete_student() {
        // GIVEN
        when(studentRepository.existsById(ID)).thenReturn(true);

        // THEN
        assertThat(studentService.delete(ID)).isTrue();
        verify(studentRepository).deleteById(ID);
    }
}
