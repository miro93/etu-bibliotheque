package com.openclassrooms.etudiant.configuration.security;

import com.openclassrooms.etudiant.entities.User;
import com.openclassrooms.etudiant.repository.UserRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(SpringExtension.class)
public class CustomUserDetailServiceTest {
    private static final String LOGIN = "LOGIN";
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private CustomUserDetailService customUserDetailService;

    @Test
    public void test_load_unknown_user_throws_UsernameNotFoundException() {
        // GIVEN
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.empty());

        // THEN
        Assertions.assertThrows(UsernameNotFoundException.class,
                () -> customUserDetailService.loadUserByUsername(LOGIN));
    }

    @Test
    public void test_load_user_by_login() {
        // GIVEN
        User user = new User();
        user.setLogin(LOGIN);
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.of(user));

        // THEN
        assertThat(customUserDetailService.loadUserByUsername(LOGIN).getUsername()).isEqualTo(LOGIN);
    }
}
