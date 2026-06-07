# CHAPTER 4

## IMPLEMENTATION

The plan is for the system to be a robust, reliable medical product that can be used as a first step
towards the automation of retinal disease screening from OCT (Optical Coherence Tomography) images.
Instead of a single monolithic program, the system was deliberately developed in a **microservice
architecture**, separating the web application from the heavy machine-learning workload, using tools
that support the DevOps lifecycle and allow each part of the system to evolve independently.

This link leads to the GitHub repository that contains the entire code base for the **OCT Analysis
Platform** system: **OCT PLATFORM REPOSITORY**.

The platform is composed of three independently running services that communicate over HTTP and
WebSockets:

| Service | Technology | Port | Responsibility |
|---------|-----------|------|----------------|
| Backend (Web API) | Java Spring Boot 3.5.11 | 9000 | Authentication, business logic, persistence, real-time messaging, AI chat orchestration |
| Frontend (Client) | React 19 + Vite | 5173 | User interface for Patients, Doctors, and Admins |
| AI Engine | Python FastAPI | 8001 | OCT image classification, fluid quantification, and image enhancement |
| Database | PostgreSQL 16 | 5432 | Persistent relational storage |

**The following four sections will explain in detail the implementation process for the system, as
well as any difficulties that the team was able to overcome; the sections will cover Backend,
Frontend, AI Engine, and DevOps tools respectively.**

---

### 4.1 Backend

#### 4.1.1 Tech Stack & Important Concepts

Using **Java 21** as the programming language with **Spring Boot 3.5.11** as the core framework
providing auto-configuration, dependency injection, and an embedded Tomcat server, with dependencies
such as:

- **Spring Web MVC** to enable **RESTful API** functionalities and expose the system's endpoints.
- **Spring Data JPA** (Hibernate) which provides JpaRepository interfaces for database access, and
  automatically maps Java entities to PostgreSQL tables.
- **Spring Security 6** which is mainly used for authentication and authorization, providing a
  **stateless JWT** login mechanism, **BCrypt** password hashing, **CORS** configuration, and
  fine-grained role-based access control.
- **io.jsonwebtoken (JJWT 0.12.6)** to create and validate the JSON Web Tokens.
- **Spring WebSocket** with the **STOMP** sub-protocol to enable real-time, bidirectional messaging
  between patients and doctors.
- **Spring Mail (JavaMailSender)** to compose and deliver one-time-password (OTP) emails for the
  password-reset feature.
- **PostgreSQL JDBC driver** to connect to the **PostgreSQL 16** relational database, where all system
  data is stored.

These are all the main frameworks, libraries, and dependencies used for the backend aspect of the
**OCT Analysis Platform**.

#### 4.1.2 The Data Model (Entities)

Data storage is a crucial aspect of any system. The backend defines the following JPA entities, each
mapped to a PostgreSQL table:

| Entity | Purpose | Key Attributes |
|--------|---------|----------------|
| **User** | A single account for all roles | id, name, email, password (BCrypt), role, status, banned, profilePicture, phone, bio, dateOfBirth, gender, country, online, verification documents |
| **Report** | A saved AI analysis sent to a doctor | patientId, doctorId, type, diagnosis, confidence, recommendation, status, imageData, createdAt |
| **Message** | One chat message | senderId, receiverId, content, createdAt |
| **DoctorProfile** | A doctor's professional profile | doctorId, specialty, hospital, yearsExperience, consultationFee, clinicName, clinicAddress, clinicLatitude, clinicLongitude |
| **DoctorCertificate** | A doctor's certificate | doctorId, certificateName, institution, yearObtained, certificateImage |
| **DoctorSkill** | A doctor's skill | doctorId, skillName, proficiencyLevel |
| **DoctorRating** | A patient's review of a doctor | doctorId, patientId, rating (1–5), review, createdAt (unique per doctor+patient) |
| **PatientImage** | A patient's private OCT image | patientId, source, imageData, uploadedAt |
| **Complaint** | A report filed against a user | reporterId, targetUserId, reason |
| **PasswordResetOtp** | A time-limited reset code | email, otpCode, createdAt, expiresAt, isUsed |

A single **User** entity holds all three roles (PATIENT, DOCTOR, ADMIN), distinguished by the `role`
field. PATIENT accounts are activated instantly, whereas DOCTOR accounts are created with a `PENDING`
status and must be approved by an admin before they can log in.

#### 4.1.3 The Layered Architecture

The following will explain the role of every part (package) in the backend code base, following the
classic three-layer Spring Boot architecture:

- The **entity** package contains the entities listed above, each annotated with JPA mappings and
  lifecycle hooks (e.g. `@PrePersist` to set `createdAt` automatically).

- The **dto (Data Transfer Object)** package is the closest part to the frontend; it includes records
  such as **LoginRequest**, **RegisterRequest**, and **ChatRequest**. This means that only the fields an
  operation actually needs are passed between the frontend and the backend — improving security,
  flexibility, and performance.

- The first layer of any Spring Boot application is the **Controller layer** (the **API endpoints
  layer**), which directly communicates with the frontend. Its job is to receive requests and delegate
  them. The system exposes the following controllers:

  | Controller | Base Path | Role |
  |-----------|-----------|------|
  | AuthController | `/api/auth` | Register and login (issues JWT) |
  | UserController | `/api/users` | List doctors/patients, set online status |
  | ReportController | `/api/reports` | Create, fetch, delete, and update report status |
  | MessageController | `/api/messages` | Load chat history |
  | WebSocketMessageController | `/app/chat.send` | Receive and broadcast live messages |
  | UserProfileController | `/api/profile` | View/update profile, upload picture, change password |
  | DoctorProfileController | `/api/doctor` | Full doctor profile, certificates, skills |
  | RatingController | `/api/rating` | Submit and read doctor ratings |
  | LocationController | `/api/location`, `/api/doctors/by-location` | Countries/cities and location-based search |
  | ChatbotController | `/api/chatbot` | The AI medical assistant |
  | PasswordResetController | `/api/auth` | Forgot / verify-OTP / reset password |
  | AdminController | `/api/admin` | Approve/reject/ban users, view stats, manage complaints |
  | ComplaintController | `/api/complaints` | File a complaint against a user |

- The second layer is the **Service layer** (the **Business Logic Layer**), which performs the actual
  work. Any normal task — generating a JWT, hashing a password, building the chatbot's context — is
  handled here. Two dedicated services stand out: the **EmailService**, which composes and sends the HTML
  OTP email, and the **GeminiService**, which is the main way AI chat integration is utilized in the OCT
  Analysis Platform.

- The third and final layer is the **Repository layer**, which is responsible for database communication
  through Spring Data JPA interfaces. Spring generates the SQL automatically from method names such as
  `findByEmail`, `findByDoctorIdOrderByCreatedAtDesc`, or `findAverageRatingByDoctorId`.

#### 4.1.4 Security & Authentication

Security is enforced through a **stateless JWT** model implemented in the **security** and **config**
packages:

- The **JwtUtil** class generates a token signed with **HMAC-SHA256** that carries the user's id, email,
  and role as claims, with a **24-hour** expiry.
- The **JwtFilter** class is a `OncePerRequestFilter` that runs on every request, reads the
  `Authorization: Bearer <token>` header, validates the token, and places the authenticated user into
  Spring's `SecurityContext`.
- The **SecurityConfig** class disables sessions (stateless), configures CORS for the frontend origin,
  registers the JWT filter, and defines the role rules. For example:
  - `/api/auth/**`, `/ws/**`, and `/api/location/**` are public.
  - `/api/admin/**` requires the **ADMIN** role.
  - `/api/chatbot/**` and `/api/patient-images/**` require the **PATIENT** role.
  - `/api/reports/**` and `/api/messages/**` require **PATIENT** or **DOCTOR**.

**Example:**
when a user enters their credentials to register, the frontend passes the information as a
**RegisterRequest** object to the **AuthController** endpoint (`"/api/auth/register"`). The controller
uses a bean of the **UserRepository** to ensure the email is not already taken, hashes the password with
**BCrypt**, sets the account status (ACTIVE for patients, PENDING for doctors), and — for doctors — also
creates an initial **DoctorProfile** record. On a subsequent login, the **JwtUtil** issues a signed token
that the frontend stores and attaches to every future request.

#### 4.1.5 Real-time Messaging

Real-time chat is configured in the **WebSocketConfig** class, which enables a simple **STOMP** message
broker with a `/topic` prefix, an `/app` application prefix, and a `/ws` SockJS endpoint. When a client
publishes a message to `/app/chat.send`, the **WebSocketMessageController** saves it to PostgreSQL and
then broadcasts the saved message to both the receiver's channel `/topic/messages.{receiverId}` and the
sender's channel `/topic/messages.{senderId}`, so both user interfaces update instantly without a page
refresh.

**This layered architecture ensures separation of concerns as well as improving security, and makes the
system easier to develop, debug, and update.**

---

### 4.2 Frontend

#### 4.2.1 Tech Stack & Important Concepts

Using **JavaScript (JSX)** as the programming language, **React 19** as the main UI library with hooks
and the Context API for state management, **Vite 7** as the build tool and development server, **Tailwind
CSS** for utility-first styling to offer a clean, friendly user interface, **React Router** for
client-side navigation, **lucide-react** for the icon set, **@stomp/stompjs** with **sockjs-client** to
power the real-time messaging client, and **Leaflet** with **OpenStreetMap** for the interactive
clinic-location map picker (no API key required).

These are the main frameworks, libraries, and tools used in the frontend aspect of the **OCT Analysis
Platform**, to offer a smooth user experience.

#### 4.2.2 Structure of the Codebase

The following will explain the role of every part in the frontend codebase:

- **Main structure (Layouts):** the application is wrapped by role-based layout components —
  **PatientLayout**, **DoctorLayout**, and **AdminLayout** — whose job is to provide the skeleton (the
  left side-navigation bar and the top header) while the actual pages are rendered as their children.
  This ensures a uniform look and avoids code duplication. `App.jsx` decides which layout to render based
  on the logged-in user's role.

- **Components:** a component is a reusable block of code used wherever the same structure is required
  more than once. The system includes **SendToDoctorModal** (pick a doctor and attach a report),
  **StarRating** (interactive 1–5 star selector), **FloatingChatbot** (the AI assistant bubble),
  **LocationPickerModal** (the Leaflet map picker), **DarkModeToggle**, and **LanguageToggle**.

- **Hooks:** hooks are special functions used inside functional components, usually prefixed with "use".
  Besides the built-in **useState** (local state) and **useEffect** (load data when a page mounts), the
  team wrote two custom hooks:
  - **useWebSocket** — opens and manages the STOMP-over-SockJS connection and exposes a `sendWsMessage`
    function. It uses a *callback ref* pattern so the live subscription always calls the latest handler
    without being recreated, avoiding stale-closure bugs.
  - **useDarkMode** — toggles the `dark` class on the document root and persists the choice in
    `localStorage`.

- **Context (global state):** data shared across the whole app is provided through React's Context API.
  **ReportsContext** holds the patient's reports, and **LanguageContext** holds the active language and
  the `t()` translation function.

- **API integration:** to integrate with the Spring Boot backend, the native **fetch** API was used. A
  central `api.js` module attaches the JWT to every request through an `authHeaders()` helper. Responses
  are handled as JSON (e.g. a login token, a list of reports), or as binary **Blobs** (e.g. an enhanced
  OCT image returned from the AI service).

#### 4.2.3 Feature Deep Dive

- **AI Diagnosis:** the patient uploads an OCT scan; the frontend sends it as multipart form-data to the
  AI service and renders the returned classification (**CNV, DME, DRUSEN, or NORMAL**) together with the
  confidence score and a per-class probability breakdown. The uploaded image is simultaneously and
  automatically saved to the patient's **private gallery**.

- **Image Enhancement & Fluid Quantification:** these pages send the OCT image to dedicated AI endpoints.
  The enhancement page receives a sharpened image Blob and displays it side-by-side with the original;
  the fluid page receives a fluid percentage, a severity recommendation, and a segmentation-mask overlay.

- **My Reports & Sending to a Doctor:** every analysis can be sent to a doctor through the
  **SendToDoctorModal**, which lists doctors (with their rating and country) and creates a Report record.
  The patient can later track each report's status (Pending / Reviewed) on the **My Reports** page.

- **Real-time Messaging:** the **useWebSocket** hook connects on mount and subscribes to the user's
  personal channel. Because the backend broadcasts each saved message back to both parties, the
  conversation updates live without refreshing; the initial history is still loaded once over HTTP. On
  the doctor side, opening a patient's avatar reveals a panel to view the patient's profile, **block** the
  patient, or **report** them to the admin.

- **Doctor Profiles & Ratings:** doctors manage a professional profile organized into **Profile /
  Certificates / Ratings** tabs (Facebook-style cover and avatar). Patients can browse doctors, open the
  same tabbed public profile, and leave a **1–5 star** review with optional text (one review per doctor).

- **Clinic Location & Maps:** doctors pin their exact clinic location either by using the browser's
  geolocation or by clicking a point on an interactive **Leaflet** map (with place search via the free
  **Nominatim** service). The coordinates are stored, an embedded map preview is shown on the profile,
  and patients can open the exact location in **Google Maps** with one click. The **Find Doctors** page
  lets patients filter doctors by country and sort by rating or number of reviews.

- **Floating Chatbot:** a floating assistant available on every patient page. It sends the patient's
  message to the backend, which enriches it with **live platform data** (e.g. how many doctors are
  online) and the patient's latest diagnosis, then forwards it to the Gemini model and returns a
  context-aware answer. The assistant knows the full feature set of the platform and replies in the
  user's language.

- **Translation:** the interface can be toggled instantly between **English (LTR)** and **Arabic (RTL)**.
  This feature is built as a globally accessible wrapper using React's `createContext` and a
  **LanguageProvider** component. Any nested component reads the active language through `useLang()` and
  the reusable `t()` function, which looks the key up in a static dictionary (`i18n.js`) and returns the
  correct localized string, while the provider flips the document direction to right-to-left for Arabic.

- **Dark Mode:** a theme toggle persists the choice in `localStorage` and applies a dark palette across
  the whole application through Tailwind's class-based dark mode combined with global CSS overrides.

- **Authentication & Password Recovery:** the **Log In** page stores the returned JWT and parses the user
  object into global state. **Registration** collects the role, country, and — for doctors — verification
  documents and clinic details. The **Forgot Password** flow is a three-step experience: the user enters
  their email, receives a **6-digit OTP** by email, enters it into six auto-advancing input boxes guarded
  by a countdown timer, and finally sets a new password (with a live strength indicator).

**This structured client-side architecture ensures efficiency in both state distribution and component
reuse, minimizing code duplication.**

---

### 4.3 AI Engine

#### 4.3.1 Tech Stack & Services

Using **Python 3.11** as the programming language, **FastAPI** as the web framework, **TensorFlow /
Keras** to load and run the deep-learning models, **Pillow (PIL)** and **NumPy** for image processing
and computer vision, the **Google GenAI SDK** (specifically the **gemini-2.5-flash** model) for the
conversational medical assistant, and **Uvicorn**, a lightning-fast ASGI (Asynchronous Server Gateway
Interface) server.

The AI service operates in a **stateless** manner, leveraging the robust Python ecosystem for machine
learning and utilizing the tools mentioned above. It also enables **CORS** so the browser and the Spring
Boot backend can call it directly.

The following will explain the services our AI engine offers:

**1- OCT Classification (Disease Detection)** — endpoint `POST /classify`:
- **Model:** a convolutional neural network built on **MobileNetV3** transfer learning, loaded from a
  trained `.h5` file, that classifies an OCT scan into one of four classes: **CNV, DME, DRUSEN, NORMAL**.
- **Pre-processing:** the uploaded image is decoded with Pillow, resized to **224×224**, converted to a
  NumPy array, expanded to a batch, and passed through the model's `preprocess_input` function.
- **Output:** the engine returns the predicted disease, the confidence percentage, and the complete
  per-class probability breakdown.

**2- Retinal Fluid Quantification** — endpoint `POST /measure-fluid`:
- **Model:** a **U-Net** segmentation network that produces a pixel-level mask of fluid regions, mainly
  for DME cases.
- **Logic:** the engine thresholds the mask, counts the fluid pixels relative to the total, converts that
  into a **fluid percentage**, derives a severity recommendation (no significant fluid / mild / moderate /
  severe), and returns a colored mask overlay encoded as base64 for display on the frontend.

**3- Image Enhancement** — endpoint `POST /enhance`:
- A classical computer-vision pipeline using Pillow: up-scaling with the LANCZOS filter, median
  filtering, unsharp masking, and contrast/sharpness/edge enhancement. The denoised, sharpened result is
  streamed back to the client as a PNG image.

**4- Medical Assistant (Conversational AI):**
- Orchestrated from the Spring Boot **GeminiService**, which builds a dynamic system prompt — containing
  live platform data, the platform's full feature guide, and the patient's context — and calls the
  **gemini-2.5-flash** model. The model replies in the same language the user wrote in, always recommends
  consulting a doctor, and never gives a definitive diagnosis.

#### 4.3.2 Feature Pipeline

**1. Disease Classification (CNN pipeline):**
How do we make sure the engine returns an accurate, trustworthy diagnosis instead of guessing?
- **Step 1 — Taking the input:** the patient uploads an OCT scan from the AI Diagnosis page.
- **Step 2 — Pre-processing:** the image is resized and normalized to exactly match what the model saw
  during training.
- **Step 3 — Inference:** the MobileNetV3 model produces a probability for each of the four classes.
- **Step 4 — Structured output:** the engine returns the top class, its confidence, and the full score
  breakdown so the patient — and later the reviewing doctor — can judge the result before it is saved.

**2. Fluid Measurement (segmentation pipeline):**
- **Step 1 — Input & resize:** the OCT scan is resized to the U-Net's expected input size.
- **Step 2 — Segmentation:** the network outputs a probability mask of fluid regions.
- **Step 3 — Quantification:** fluid pixels are counted and converted into a percentage and a severity
  label.
- **Step 4 — Visualization:** a colored overlay mask is returned so the patient sees exactly where the
  fluid was detected.

**3. Resilient Integration (Backend ↔ AI):**
How do we move image files between the Java and Python environments without breaking the system?
- **Step 1 — Multipart transfer:** the OCT image is sent to FastAPI as multipart/form-data.
- **Step 2 — Async processing:** FastAPI reads the file asynchronously (`await file.read()`), allowing a
  single ASGI worker to handle multiple concurrent, heavy image-processing requests.
- **Step 3 — Returning the result:** predictions are returned as JSON, while enhanced images are streamed
  back as a binary response, keeping the transfer efficient.

**4. Keeping the assistant alive (Fault Tolerance):**
- If the Gemini provider blocks a request (e.g. HTTP 429) or is temporarily unavailable, the backend
  catches the failure and returns a friendly fallback message, so the user experience is never
  interrupted by a raw error.

**This stateless architecture ensures a clear separation of the heavy machine-learning tasks from the
main backend, minimizing latency while keeping the AI engine fault-tolerant and responsive.**

---

### 4.4 DevOps Culture Practices

To ensure the reliability and scalability of the system, a modern DevOps methodology was integrated into
the development lifecycle.

**4.4.1 Version Control:** During the coding phase, the team used **GitHub** to track changes in code,
ensuring a reliable version history and enabling smooth collaboration across the development team.

**4.4.2 Microservice Separation:** the system is split into three independently runnable services — the
**Spring Boot backend** (port 9000), the **React/Vite frontend** (port 5173), and the **FastAPI AI
engine** (port 8001), backed by a **PostgreSQL 16** database. This keeps the heavy machine-learning
Python environment fully isolated from the Java web application, so a fault or a slow model never blocks
the rest of the system, and each service can be developed, scaled, and deployed on its own.

**4.4.3 Configuration & Security Practices:** sensitive values — the database credentials, the JWT
signing key, the mail-server app password, and the Gemini API key — are kept in the backend's
`application.properties` configuration rather than hard-coded in the source. **CORS** rules restrict
which origins may reach the API, the database schema is kept in sync automatically through Hibernate's
`ddl-auto=update`, and all passwords are stored only as irreversible **BCrypt** hashes.

**These practices ensure that any new requirements that might arise, as well as the deployment of the
system, will not cause a bottleneck for the team; each new requirement will be planned for, coded,
built, tested, and then integrated into the system.**
