
package com.dairytrack.security;

import com.dairytrack.milker.Milker;
import com.dairytrack.milker.repository.MilkerRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final MilkerRepository milkerRepository;
    private final PasswordEncoder passwordEncoder;

    private final HttpSessionSecurityContextRepository
            securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public AuthController(
            AuthenticationManager authenticationManager,
            AppUserRepository appUserRepository,
            MilkerRepository milkerRepository,
            PasswordEncoder passwordEncoder) {

        this.authenticationManager = authenticationManager;
        this.appUserRepository = appUserRepository;
        this.milkerRepository = milkerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    request.getUsername(),
                                    request.getPassword()
                            )
                    );

            SecurityContext context =
                    SecurityContextHolder.createEmptyContext();

            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            httpRequest.getSession(true);

            securityContextRepository.saveContext(
                    context, httpRequest, httpResponse
            );

            AppUser appUser = appUserRepository
                    .findByUsername(authentication.getName())
                    .orElseThrow();

            return ResponseEntity.ok(
                    new LoginResponse(
                            appUser.getId(),
                            appUser.getUsername(),
                            appUser.getRole().name()
                    )
            );

        } catch (AuthenticationException ex) {
            SecurityContextHolder.clearContext();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Invalid username or password."
                    ));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not logged in."));
        }

        AppUser appUser = appUserRepository
                .findByUsername(authentication.getName())
                .orElse(null);

        if (appUser == null || !appUser.isActive()) {
            SecurityContextHolder.clearContext();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Account is unavailable."));
        }

        return ResponseEntity.ok(
                Map.of(
                        "id", appUser.getId(),
                        "username", appUser.getUsername(),
                        "role", appUser.getRole().name()
                )
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully.")
        );
    }

    @PostMapping("/milker-account")
    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public ResponseEntity<?> createMilkerAccount(
            @RequestBody CreateMilkerAccountRequest request) {

        if (request.getMilkerId() == null
                || request.getUsername() == null
                || request.getPassword() == null) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Milker ID, username and password are required."
                    )
            );
        }

        String username = request.getUsername().trim();
        String password = request.getPassword();

        if (username.isBlank() || username.length() > 60) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Username must contain 1 to 60 characters."
                    )
            );
        }

        if (password.length() < 12) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Password must contain at least 12 characters."
                    )
            );
        }

        if (appUserRepository.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of("message", "Username is already in use.")
            );
        }

        Milker milker = milkerRepository
                .findById(request.getMilkerId())
                .orElse(null);

        if (milker == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("message", "Milker profile was not found.")
            );
        }

        if (!milker.isActive()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Cannot create an account for an inactive milker.")
            );
        }

        boolean alreadyLinked = appUserRepository.findAll()
                .stream()
                .anyMatch(user ->
                        user.getMilker() != null
                                && user.getMilker().getId()
                                .equals(milker.getId())
                );

        if (alreadyLinked) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of(
                            "message",
                            "This milker already has a login account."
                    )
            );
        }

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(UserRole.MILKER);
        user.setActive(true);
        user.setMilker(milker);

        AppUser savedUser = appUserRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "id", savedUser.getId(),
                        "username", savedUser.getUsername(),
                        "role", savedUser.getRole().name(),
                        "milkerId", milker.getId(),
                        "milkerName", milker.getFullName()
                )
        );
    }
}
