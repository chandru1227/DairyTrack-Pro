
package com.dairytrack.security;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class OwnerAccountInitializer {

    @Bean
    public CommandLineRunner createInitialOwner(
            AppUserRepository repository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (repository.existsByUsername("owner")) {
                System.out.println(
                        "Owner account already exists. No account changes made."
                );
                return;
            }

            String initialPassword = System.getenv("DAIRYTRACK_OWNER_PASSWORD");

            if (initialPassword == null || initialPassword.isBlank()) {
                System.out.println(
                        "Initial owner not created. Set the " +
                                "DAIRYTRACK_OWNER_PASSWORD environment variable " +
                                "and restart the application."
                );
                return;
            }

            if (initialPassword.length() < 12) {
                throw new IllegalStateException(
                        "Initial owner password must contain at least 12 characters."
                );
            }

            AppUser owner = new AppUser();
            owner.setUsername("owner");
            owner.setPasswordHash(
                    passwordEncoder.encode(initialPassword)
            );
            owner.setRole(UserRole.OWNER);
            owner.setActive(true);

            repository.save(owner);

            System.out.println(
                    "Initial owner account created successfully."
            );
        };
    }
}
