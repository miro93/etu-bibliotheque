package com.openclassrooms.etudiant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openclassrooms.etudiant.dto.StudentDTO;
import com.openclassrooms.etudiant.entities.Student;
import com.openclassrooms.etudiant.entities.User;
import com.openclassrooms.etudiant.repository.StudentRepository;
import com.openclassrooms.etudiant.repository.UserRepository;
import com.openclassrooms.etudiant.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
public class StudentControllerTest {

    private static final String URL = "/api/students";
    private static final String FIRST_NAME = "John";
    private static final String LAST_NAME = "Doe";
    private static final String EMAIL = "john.doe@test.com";
    private static final String OTHER_EMAIL = "jane.doe@test.com";
    private static final String LOGIN = "login";
    private static final String PASSWORD = "password";


    @Container
    static MySQLContainer mySQLContainer = new MySQLContainer("mysql:8.4");

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private MockMvc mockMvc;

    private String token;

    @DynamicPropertySource
    static void configureTestProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> mySQLContainer.getJdbcUrl());
        registry.add("spring.datasource.username", () -> mySQLContainer.getUsername());
        registry.add("spring.datasource.password", () -> mySQLContainer.getPassword());
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");
        registry.add("jwt.secret", () -> "test-secret-test-secret-test-secret-test-secret");

    }

    @BeforeEach
    public void beforeEach() {
        // Real token, obtained the same way a client would
        User user = new User();
        user.setFirstName(FIRST_NAME);
        user.setLastName(LAST_NAME);
        user.setLogin(LOGIN);
        user.setPassword(PASSWORD);
        userService.register(user);
        token = userService.login(LOGIN, PASSWORD).token();
    }

    @AfterEach
    public void afterEach() {
        studentRepository.deleteAll();
        userRepository.deleteAll();
    }

    private static StudentDTO studentDTO(String email) {
        StudentDTO studentDTO = new StudentDTO();
        studentDTO.setFirstName(FIRST_NAME);
        studentDTO.setLastName(LAST_NAME);
        studentDTO.setEmail(email);
        return studentDTO;
    }

    private Student savedStudent(String email) {
        return studentRepository.save(new Student(null, FIRST_NAME, LAST_NAME, email));
    }

    private MockHttpServletRequestBuilder authenticated(MockHttpServletRequestBuilder request) {
        return request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON);
    }

    @Test
    public void allEndpointsWithoutTokenAreUnauthorized() throws Exception {
        // GIVEN
        Student student = savedStudent(EMAIL);
        String body = objectMapper.writeValueAsString(studentDTO(OTHER_EMAIL));

        // THEN
        mockMvc.perform(MockMvcRequestBuilders.get(URL))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
        mockMvc.perform(MockMvcRequestBuilders.get(URL + "/" + student.getId()))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
        mockMvc.perform(MockMvcRequestBuilders.post(URL).content(body).contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
        mockMvc.perform(MockMvcRequestBuilders.put(URL + "/" + student.getId()).content(body)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
        mockMvc.perform(MockMvcRequestBuilders.delete(URL + "/" + student.getId()))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
        assertThat(studentRepository.count()).isEqualTo(1);
    }

    @Test
    public void findAllWithInvalidTokenIsUnauthorized() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get(URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    public void createStudentWithoutRequiredData() throws Exception {
        mockMvc.perform(authenticated(MockMvcRequestBuilders.post(URL))
                        .content(objectMapper.writeValueAsString(new StudentDTO())))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void createStudentWithInvalidEmail() throws Exception {
        mockMvc.perform(authenticated(MockMvcRequestBuilders.post(URL))
                        .content(objectMapper.writeValueAsString(studentDTO("not-an-email"))))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void createStudentWithAlreadyUsedEmail() throws Exception {
        // GIVEN
        savedStudent(EMAIL);

        // WHEN
        mockMvc.perform(authenticated(MockMvcRequestBuilders.post(URL))
                        .content(objectMapper.writeValueAsString(studentDTO(EMAIL))))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isConflict());
        assertThat(studentRepository.count()).isEqualTo(1);
    }

    @Test
    public void createStudentSuccessful() throws Exception {
        mockMvc.perform(authenticated(MockMvcRequestBuilders.post(URL))
                        .content(objectMapper.writeValueAsString(studentDTO(EMAIL))))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").isNumber())
                .andExpect(MockMvcResultMatchers.jsonPath("$.email").value(EMAIL));
        assertThat(studentRepository.existsByEmail(EMAIL)).isTrue();
    }

    @Test
    public void findAllStudents() throws Exception {
        // GIVEN
        savedStudent(EMAIL);
        savedStudent(OTHER_EMAIL);

        // WHEN
        mockMvc.perform(authenticated(MockMvcRequestBuilders.get(URL)))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.length()").value(2));
    }

    @Test
    public void findStudentById() throws Exception {
        // GIVEN
        Student student = savedStudent(EMAIL);

        // WHEN
        mockMvc.perform(authenticated(MockMvcRequestBuilders.get(URL + "/" + student.getId())))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.email").value(EMAIL));
    }

    @Test
    public void findUnknownStudent() throws Exception {
        mockMvc.perform(authenticated(MockMvcRequestBuilders.get(URL + "/999")))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    @Test
    public void updateStudentSuccessful() throws Exception {
        // GIVEN
        Student student = savedStudent(EMAIL);

        // WHEN
        mockMvc.perform(authenticated(MockMvcRequestBuilders.put(URL + "/" + student.getId()))
                        .content(objectMapper.writeValueAsString(studentDTO(OTHER_EMAIL))))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(student.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.email").value(OTHER_EMAIL));
        assertThat(studentRepository.count()).isEqualTo(1);
    }

    @Test
    public void updateStudentKeepingItsOwnEmail() throws Exception {
        // GIVEN
        Student student = savedStudent(EMAIL);

        // WHEN
        mockMvc.perform(authenticated(MockMvcRequestBuilders.put(URL + "/" + student.getId()))
                        .content(objectMapper.writeValueAsString(studentDTO(EMAIL))))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void updateStudentWithEmailOfAnotherStudent() throws Exception {
        // GIVEN
        savedStudent(EMAIL);
        Student other = savedStudent(OTHER_EMAIL);

        // WHEN
        mockMvc.perform(authenticated(MockMvcRequestBuilders.put(URL + "/" + other.getId()))
                        .content(objectMapper.writeValueAsString(studentDTO(EMAIL))))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isConflict());
    }

    @Test
    public void updateUnknownStudent() throws Exception {
        mockMvc.perform(authenticated(MockMvcRequestBuilders.put(URL + "/999"))
                        .content(objectMapper.writeValueAsString(studentDTO(EMAIL))))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    @Test
    public void deleteStudentSuccessful() throws Exception {
        // GIVEN
        Student student = savedStudent(EMAIL);

        // WHEN
        mockMvc.perform(authenticated(MockMvcRequestBuilders.delete(URL + "/" + student.getId())))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isNoContent());
        assertThat(studentRepository.count()).isZero();
    }

    @Test
    public void deleteUnknownStudent() throws Exception {
        mockMvc.perform(authenticated(MockMvcRequestBuilders.delete(URL + "/999")))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }
}
