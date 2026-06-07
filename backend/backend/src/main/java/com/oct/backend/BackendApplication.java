package com.oct.backend;

import com.oct.backend.entity.User;
import com.oct.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner seedAdmin(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
		return args -> {
			if (userRepository.findByRole("ADMIN").isEmpty()) {
				User admin = new User();
				admin.setName("System Administrator");
				admin.setEmail("admin@oct.com");
				admin.setPassword(passwordEncoder.encode("admin123"));
				admin.setRole("ADMIN");
				admin.setStatus("ACTIVE");
				userRepository.save(admin);
				System.out.println(">>> Seeded default admin: admin@oct.com / admin123");
			}
		};
	}

}
