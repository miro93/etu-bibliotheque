package com.openclassrooms.etudiant.service;

import com.openclassrooms.etudiant.entities.Student;
import com.openclassrooms.etudiant.repository.StudentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class StudentService {
    private final StudentRepository studentRepository;

    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    public Optional<Student> findById(Long id) {
        return studentRepository.findById(id);
    }

    public Student create(Student student) {
        Assert.notNull(student, "Student must not be null");
        log.info("Creating new student");

        if (studentRepository.existsByEmail(student.getEmail())) {
            throw new DuplicateKeyException("Student with email " + student.getEmail() + " already exists");
        }
        return studentRepository.save(student);
    }

    public Optional<Student> update(Long id, Student student) {
        Assert.notNull(student, "Student must not be null");
        log.info("Updating student {}", id);

        if (!studentRepository.existsById(id)) {
            return Optional.empty();
        }
        if (studentRepository.existsByEmailAndIdNot(student.getEmail(), id)) {
            throw new DuplicateKeyException("Student with email " + student.getEmail() + " already exists");
        }
        student.setId(id);
        return Optional.of(studentRepository.save(student));
    }

    public boolean delete(Long id) {
        if (!studentRepository.existsById(id)) {
            return false;
        }
        studentRepository.deleteById(id);
        return true;
    }
}
