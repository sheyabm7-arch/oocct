# ============================================================
#  Backend — Spring Boot 3.5.11 (Java 21)
#  Multi-stage build: compile with Maven, run on a slim JRE.
# ============================================================

# ---- Stage 1: Build the .jar ----
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy the Maven descriptor first so dependency layers are cached
COPY pom.xml .
# (optional) pre-download dependencies to speed up rebuilds
RUN mvn -B dependency:go-offline

# Copy the source code and build the executable jar (skip tests for a faster image)
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Stage 2: Run the .jar on a lightweight JRE ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy ONLY the built jar from the build stage (no Maven, no source)
COPY --from=builder /app/target/*.jar app.jar

# The Spring Boot app listens on 9000
EXPOSE 9000

# Launch the application
ENTRYPOINT ["java", "-jar", "app.jar"]
