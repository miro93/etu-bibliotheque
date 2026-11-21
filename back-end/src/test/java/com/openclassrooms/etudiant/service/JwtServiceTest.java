package com.openclassrooms.etudiant.service;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.spec.SecretKeySpec;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class JwtServiceTest {
    private static final String SECRET = "test-secret-test-secret-test-secret-test-secret";
    private static final String LOGIN = "LOGIN";

    private final JwtService jwtService = new JwtService(new NimbusJwtEncoder(new ImmutableSecret<>(SECRET.getBytes())));

    private static JwtDecoder decoder(String secret) {
        return NimbusJwtDecoder.withSecretKey(new SecretKeySpec(secret.getBytes(), "HmacSHA256")).build();
    }

    private static UserDetails userDetails() {
        return User.builder().username(LOGIN).password("PASSWORD").build();
    }

    @Test
    public void test_generated_token_is_a_signed_jwt_for_the_user() {
        // WHEN
        Jwt jwt = decoder(SECRET).decode(jwtService.generateToken(userDetails()));

        // THEN
        assertThat(jwt.getSubject()).isEqualTo(LOGIN);
        assertThat(jwt.getHeaders().get("alg")).hasToString("HS256");
    }

    @Test
    public void test_generated_token_expires_after_one_hour() {
        // WHEN
        Jwt jwt = decoder(SECRET).decode(jwtService.generateToken(userDetails()));

        // THEN
        assertThat(Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt())).isEqualTo(Duration.ofHours(1));
    }

    @Test
    public void test_generated_token_is_rejected_with_another_secret() {
        // GIVEN
        String token = jwtService.generateToken(userDetails());

        // THEN
        assertThrows(BadJwtException.class,
                () -> decoder("other-secret-other-secret-other-secret-other").decode(token));
    }
}
