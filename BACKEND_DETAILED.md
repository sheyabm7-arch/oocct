# 4.1 Backend (Detailed)

The backend is the heart of the **OCT Analysis Platform**. It is a **Java Spring Boot 3.5.11**
application running on **Java 21**, exposing a secure RESTful API on **port 9000**, persisting all data
in a **PostgreSQL 16** relational database, and orchestrating both the real-time messaging system and
the AI medical-assistant chatbot. This section explains, in full detail, the technologies used, the
data model, the layered architecture, the security mechanism, and the most important flows.

---

## 4.1.1 Technologies and Dependencies

Using **Java 21** as the programming language with **Spring Boot 3.5.11** as the core framework — which
provides auto-configuration, dependency injection, and an embedded **Tomcat** web server — the backend
relies on the following dependencies, each chosen for a specific responsibility:

| Dependency | Responsibility in the system |
|------------|------------------------------|
| **Spring Web (MVC)** | Builds the RESTful controllers and handles HTTP request/response mapping. |
| **Spring Data JPA (Hibernate)** | Object-Relational Mapping; turns Java entities into PostgreSQL tables and generates SQL from repository method names. |
| **Spring Security 6** | Authentication and authorization; protects every endpoint with role-based rules. |
| **io.jsonwebtoken — JJWT 0.12.6** | Creates and validates the stateless JSON Web Tokens used for login. |
| **Spring WebSocket (STOMP)** | Powers the real-time, bidirectional chat between patients and doctors. |
| **Spring Mail (JavaMailSender)** | Sends the HTML one-time-password (OTP) emails for password recovery. |
| **PostgreSQL JDBC Driver** | Connects the application to the PostgreSQL 16 database. |
| **Lombok** | Removes boilerplate (getters, setters, constructors) through annotations such as `@Data`. |
| **BCrypt (Spring Security Crypto)** | Hashes user passwords irreversibly before storing them. |

The central configuration file, `application.properties`, holds the database connection URL and
credentials, the server port (9000), the JPA setting `ddl-auto=update` (which keeps the database schema
synchronized with the entities automatically), the JWT signing secret, the Gmail SMTP settings for the
mail service, and the Gemini API key.

---

## 4.1.2 The Data Model (Entities and Database)

Data storage is a crucial aspect of any system. Using JPA, every Java entity in the **entity** package
is automatically mapped to a PostgreSQL table. The system defines ten core entities:

**1. User** — a single, unified account used by all three roles.

| Field | Type | Description |
|-------|------|-------------|
| id | Long (PK) | Auto-generated identifier |
| name, email, password | String | Credentials; the password is stored only as a BCrypt hash |
| role | String | `PATIENT`, `DOCTOR`, or `ADMIN` |
| status | String | `ACTIVE`, `PENDING`, or `REJECTED` |
| banned | Boolean | Whether the admin has banned the account |
| idDocument, specialtyCertificate, practiceLicense | TEXT | Base64 verification documents (doctors only) |
| profilePicture, phone, bio, gender, country | — | Profile information |
| dateOfBirth | LocalDate | Date of birth |
| online | boolean | Live presence indicator for the chat |
| createdAt | LocalDateTime | Set automatically on creation |

**2. Report** — a saved AI analysis the patient sends to a doctor: `patientId`, `doctorId`, `type`
(AI Diagnosis / Image Enhancement / Fluid Quantification), `diagnosis`, `confidence`, `recommendation`,
`status` (PENDING / REVIEWED), `imageData` (base64), and `createdAt`.

**3. Message** — one chat message: `senderId`, `receiverId`, `content`, `createdAt`.

**4. DoctorProfile** — a doctor's professional profile: `doctorId`, `specialty`, `hospital`,
`yearsExperience`, `consultationFee`, `clinicName`, `clinicAddress`, `clinicLatitude`, `clinicLongitude`.

**5. DoctorCertificate** — `doctorId`, `certificateName`, `institution`, `yearObtained`,
`certificateImage` (base64).

**6. DoctorSkill** — `doctorId`, `skillName`, `proficiencyLevel` (Beginner / Intermediate / Expert).

**7. DoctorRating** — a patient's review of a doctor: `doctorId`, `patientId`, `rating` (1–5), `review`,
`createdAt`. A **unique constraint** on (`doctorId`, `patientId`) guarantees that a patient can rate each
doctor only once.

**8. PatientImage** — a patient's private OCT image gallery: `patientId`, `source`, `imageData`
(base64), `uploadedAt`. These images are visible only to their owner.

**9. Complaint** — a report filed against a user: `reporterId`, `targetUserId`, `reason`.

**10. PasswordResetOtp** — a time-limited reset code: `email`, `otpCode`, `createdAt`, `expiresAt`
(60 seconds after creation), `isUsed`.

A key design decision is the **single User table for all roles**, distinguished by the `role` field.
PATIENT accounts become `ACTIVE` immediately, whereas DOCTOR accounts are created as `PENDING` and
cannot log in until an admin approves them.

---

## 4.1.3 The Three-Layer Architecture

The backend follows the classic Spring Boot layered architecture, which enforces a clean separation of
concerns. A request flows downward through the layers and the response flows back up.

### (a) The Controller Layer (API Endpoints)

This is the entry point that communicates directly with the frontend. Its only job is to receive an HTTP
request, validate basic input, and delegate the work to the service or repository layer. The system
exposes the following endpoints:

| Controller | Method & Path | Purpose |
|-----------|---------------|---------|
| **AuthController** | `POST /api/auth/register` | Create a patient or doctor account |
| | `POST /api/auth/login` | Authenticate and return a JWT |
| **UserController** | `GET /api/users/doctors` | List approved doctors |
| | `GET /api/users/patients` | List patients |
| | `PUT /api/users/{id}/status` | Set the user's online status |
| **ReportController** | `POST /api/reports` | Save a new report |
| | `GET /api/reports/patient/{id}` | A patient's reports |
| | `GET /api/reports/doctor/{id}` | A doctor's received reports |
| | `PUT /api/reports/{id}/status` | Mark a report as reviewed |
| | `DELETE /api/reports/{id}` | Delete a report |
| **MessageController** | `GET /api/messages/{userId}` | Load conversation history |
| **WebSocketMessageController** | `@MessageMapping /app/chat.send` | Receive & broadcast a live message |
| **UserProfileController** | `GET /api/profile/{id}` | Read a profile |
| | `PUT /api/profile/update` | Update basic profile info |
| | `POST /api/profile/picture` | Upload a profile picture |
| | `PUT /api/profile/change-password` | Change password while logged in |
| **DoctorProfileController** | `GET /api/doctor/profile/{id}` | Full doctor profile (with certs, skills, rating) |
| | `PUT /api/doctor/profile/update` | Update professional info & clinic location |
| | `POST/DELETE /api/doctor/certificates` | Add / remove a certificate |
| | `POST/DELETE /api/doctor/skills` | Add / remove a skill |
| **RatingController** | `POST /api/rating/submit` | Submit a 1–5 star review |
| | `GET /api/rating/doctor/{id}` | All reviews of a doctor |
| | `GET /api/rating/doctor/{id}/average` | Average rating & count |
| | `GET /api/rating/check/{doctorId}/{patientId}` | Has this patient already rated? |
| **LocationController** | `GET /api/location/countries` | List of countries |
| | `GET /api/doctors/by-location` | Search doctors by country |
| **ChatbotController** | `POST /api/chatbot/message` | Ask the AI medical assistant |
| **PasswordResetController** | `POST /api/auth/forgot-password` | Send an OTP by email |
| | `POST /api/auth/verify-otp` | Verify the OTP |
| | `POST /api/auth/reset-password` | Set a new password |
| **AdminController** | `GET /api/admin/users`, `/stats` | List users, dashboard statistics |
| | `PUT /api/admin/users/{id}/approve` | Approve a pending doctor |
| | `PUT /api/admin/users/{id}/reject` `/ban` | Reject or ban a user |
| | `GET/PUT/DELETE /api/admin/complaints` | Manage complaints |
| **ComplaintController** | `POST /api/complaints` | File a complaint against a user |

### (b) The Service Layer (Business Logic)

This layer performs the actual work and contains the rules of the system. Most logic lives directly
inside the controllers for simple CRUD operations, but two responsibilities are heavy enough to be
isolated into dedicated service classes:

- **EmailService** — uses `JavaMailSender` to build a styled **HTML email** containing the 6-digit OTP
  and send it through Gmail's SMTP server.
- **GeminiService** — uses a `RestTemplate` to call the **gemini-2.5-flash** model. It receives the
  conversation history and a dynamically built system prompt, then returns the assistant's reply. This is
  the main way AI chat integration is utilized in the platform.

### (c) The Repository Layer (Persistence)

The repository layer is responsible for all database communication. Each repository is a Spring Data JPA
interface, and Spring automatically generates the SQL implementation from the method name. Examples:

- `UserRepository.findByEmail(String email)`
- `UserRepository.countByRoleAndStatus(String role, String status)`
- `ReportRepository.findByPatientIdOrderByCreatedAtDesc(Long id)`
- `DoctorRatingRepository.findAverageRatingByDoctorId(Long id)` *(a custom `@Query`)*
- `PasswordResetOtpRepository.findByEmailAndOtpCodeAndIsUsedFalse(...)`

---

## 4.1.4 Security and Authentication (Stateless JWT)

Because the API is stateless, the backend does not keep server-side sessions. Instead, every request
proves its identity with a **JSON Web Token (JWT)**. The mechanism is split across the **security** and
**config** packages:

- **JwtUtil** — generates a token signed with the **HMAC-SHA256** algorithm. The token's payload carries
  three claims: the user's `id`, `email`, and `role`, and it expires after **24 hours**. The same class
  also validates incoming tokens and extracts their claims.

- **JwtFilter** — a `OncePerRequestFilter` registered before Spring's default authentication filter. On
  every request it reads the `Authorization: Bearer <token>` header; if the token is valid, it builds an
  authentication object carrying the user's role (`ROLE_PATIENT`, `ROLE_DOCTOR`, or `ROLE_ADMIN`) and
  stores it in the `SecurityContext`.

- **SecurityConfig** — the central security blueprint. It disables CSRF and sessions (stateless), enables
  **CORS** for the frontend origin, registers the `JwtFilter`, exposes the **BCryptPasswordEncoder** bean,
  and declares the authorization rules per path. For example:
  - `/api/auth/**`, `/ws/**`, and `/api/location/**` are **public**.
  - `/api/admin/**` requires **ADMIN**.
  - `/api/chatbot/**` and `/api/patient-images/**` require **PATIENT**.
  - `/api/reports/**` and `/api/messages/**` require **PATIENT** or **DOCTOR**.

### Authentication Flow (Login Example)

1. The frontend sends a `POST /api/auth/login` request with the email and password inside a
   **LoginRequest** DTO.
2. **AuthController** loads the user through `UserRepository.findByEmail`, and verifies the password by
   comparing it against the stored hash with **BCrypt**.
3. It then checks the account state: a banned, rejected, or still-pending doctor is denied with a clear
   message.
4. On success, **JwtUtil** issues a signed token, which is returned together with the user's id, name,
   email, and role.
5. The frontend stores the token and attaches it (`Authorization: Bearer …`) to every subsequent request,
   where the **JwtFilter** validates it and authorizes access.

---

## 4.1.5 Real-time Messaging (WebSocket / STOMP)

Real-time chat is configured in the **WebSocketConfig** class, which enables a simple in-memory **STOMP**
broker:

- The `/topic` prefix is used for server-to-client broadcasts.
- The `/app` prefix is used for messages the client sends to the server.
- The `/ws` endpoint (with SockJS fallback) is the connection point.

When a client publishes to `/app/chat.send`, the **WebSocketMessageController** first **saves** the
message to PostgreSQL, then **broadcasts** the saved message to two destinations: the receiver's channel
`/topic/messages.{receiverId}` and the sender's channel `/topic/messages.{senderId}`. Broadcasting to
both parties means each user interface updates **instantly**, without polling or refreshing the page,
while the message is also safely persisted for history.

---

## 4.1.6 The Password-Reset Flow (Worked Example)

This flow demonstrates how several backend parts cooperate:

1. **Request** — the user submits their email to `POST /api/auth/forgot-password`. The
   **PasswordResetController** confirms the email exists, enforces a **rate limit** (max 3 requests per
   hour), generates a random **6-digit OTP**, saves a `PasswordResetOtp` row (valid for 60 seconds), and
   calls the **EmailService** to deliver a styled HTML email.
2. **Verify** — the user enters the code; `POST /api/auth/verify-otp` checks that the OTP exists, is
   unused, and has not expired.
3. **Reset** — the user submits a new password to `POST /api/auth/reset-password`. The controller
   re-validates the OTP, hashes the new password with **BCrypt**, saves it on the user, and marks the OTP
   as **used** so it cannot be replayed.

---

**This layered architecture ensures separation of concerns as well as improving security, and makes the
system easier to develop, debug, test, and update — each layer can be modified independently as long as
the contracts between them stay the same.**
