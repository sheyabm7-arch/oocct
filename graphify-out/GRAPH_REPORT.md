# Graph Report - f:/OCT-Platform  (2026-05-22)

## Corpus Check
- Corpus is ~16,703 words - fits in a single context window. You may not need a graph.

## Summary
- 339 nodes · 451 edges · 31 communities (18 shown, 13 thin omitted)
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin JSX Internal Functions|Admin JSX Internal Functions]]
- [[_COMMUNITY_Admin Management UI Layer|Admin Management UI Layer]]
- [[_COMMUNITY_Spring Boot Admin & Report Controllers|Spring Boot Admin & Report Controllers]]
- [[_COMMUNITY_Frontend NPM Dependencies|Frontend NPM Dependencies]]
- [[_COMMUNITY_Patient Report Submission Flow|Patient Report Submission Flow]]
- [[_COMMUNITY_Spring Boot Auth Layer|Spring Boot Auth Layer]]
- [[_COMMUNITY_Python CRUD Backend (Unused)|Python CRUD Backend (Unused)]]
- [[_COMMUNITY_Frontend API Client Layer|Frontend API Client Layer]]
- [[_COMMUNITY_AI Feature Pages|AI Feature Pages]]
- [[_COMMUNITY_Spring Boot Controller Core|Spring Boot Controller Core]]
- [[_COMMUNITY_AI Service ML Models|AI Service ML Models]]
- [[_COMMUNITY_Message Controller & Repository|Message Controller & Repository]]
- [[_COMMUNITY_Spring Security Config|Spring Security Config]]
- [[_COMMUNITY_Frontend Build Config|Frontend Build Config]]
- [[_COMMUNITY_Frontend Static Assets|Frontend Static Assets]]
- [[_COMMUNITY_Complaint JPA Entity|Complaint JPA Entity]]
- [[_COMMUNITY_Message JPA Entity|Message JPA Entity]]
- [[_COMMUNITY_Complaint Repository|Complaint Repository]]
- [[_COMMUNITY_Backend Tests|Backend Tests]]
- [[_COMMUNITY_Claude Permissions Settings|Claude Permissions Settings]]
- [[_COMMUNITY_Report JPA Entity|Report JPA Entity]]
- [[_COMMUNITY_User JPA Entity|User JPA Entity]]
- [[_COMMUNITY_Register DTO|Register DTO]]
- [[_COMMUNITY_Login DTO|Login DTO]]
- [[_COMMUNITY_CSS Build Config|CSS Build Config]]
- [[_COMMUNITY_Claude Local Settings|Claude Local Settings]]

## God Nodes (most connected - your core abstractions)
1. `AdminController` - 15 edges
2. `build` - 14 edges
3. `API Client (api.js)` - 13 edges
4. `AdminUsers Page` - 10 edges
5. `User JPA Entity` - 9 edges
6. `App Root Component` - 8 edges
7. `AIDiagnosis Patient Page` - 7 edges
8. `MyReports Patient Page` - 7 edges
9. `ReportController` - 6 edges
10. `getMessages()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `ReportRepository` --semantically_similar_to--> `ReportsContext & Provider`  [INFERRED] [semantically similar]
  backend/backend/src/main/java/com/oct/backend/repository/ReportRepository.java → frontend/src/context/ReportsContext.jsx
- `UserRepository` --semantically_similar_to--> `LoginPage Component`  [INFERRED] [semantically similar]
  backend/backend/src/main/java/com/oct/backend/repository/UserRepository.java → frontend/src/pages/LoginPage.jsx
- `Admin Role & Approval Flow` --rationale_for--> `AdminReports Page`  [INFERRED]
  START-HERE.md → frontend/src/pages/admin/AdminReports.jsx
- `Admin Role & Approval Flow` --rationale_for--> `AdminUsers Page`  [INFERRED]
  START-HERE.md → frontend/src/pages/admin/AdminUsers.jsx
- `AdminUsers Page` --implements--> `Doctor Registration Approval Flow`  [INFERRED]
  frontend/src/pages/admin/AdminUsers.jsx → START-HERE.md

## Hyperedges (group relationships)
- **Spring MVC Controller Layer** — admincontroller, authcontroller, complaintcontroller, messagecontroller, reportcontroller, usercontroller [EXTRACTED 1.00]
- **JPA Domain Entity Layer** — entity_user, entity_report, entity_message, entity_complaint [EXTRACTED 1.00]
- **AI Inference Endpoints (classify, fluid, enhance)** — app_classify_endpoint, app_measure_fluid_endpoint, app_enhance_endpoint [EXTRACTED 1.00]
- **Core Domain: User, Report, Message (patient-doctor workflow)** — entity_user, entity_report, entity_message, main_user_model, main_report_model, main_message_model [INFERRED 0.85]
- **Authentication and Security Group** — authcontroller, securityconfig, dto_loginrequest, dto_registerrequest, entity_user [INFERRED 0.85]
- **Frontend Role-Based Layout & Routing** — app_App, adminlayout_AdminLayout, doctorlayout_DoctorLayout, patientlayout_PatientLayout [EXTRACTED 0.95]
- **Patient-to-Doctor Report Submission Flow** — sendtodoctormodal_SendToDoctorModal, reportscontext_ReportsContext, api_reportEndpoints [EXTRACTED 0.95]
- **Admin Complaint Management Flow** — admincomplaints_AdminComplaints, api_complaintEndpoints, api_adminEndpoints [EXTRACTED 0.95]
- **Patient AI Analysis Flow: Upload OCT → AI Service → Send to Doctor** — aidiagnosis_AIDiagnosis, aiservice_ClassifyEndpoint, sendtodoctormodal_SendToDoctorModal [INFERRED 0.95]
- **Doctor Report Review Flow: Pending Reports → View → Message Patient** — doctorpendingreports_DoctorPendingReports, doctorpendingreports_ViewReportModal, doctormessages_DoctorMessages [INFERRED 0.90]
- **Admin User Management: Users List → Documents Modal → Approve/Ban/Delete** — adminusers_AdminUsers, adminusers_DocumentsModal, starthere_DoctorApprovalFlow [EXTRACTED 0.95]

## Communities (31 total, 13 thin omitted)

### Community 0 - "Admin JSX Internal Functions"
Cohesion: 0.06
Nodes (28): cards, typeIcon, statusBadge, navItems, typeIcons, typeIcon, approveUser(), banUser() (+20 more)

### Community 1 - "Admin Management UI Layer"
Cohesion: 0.09
Nodes (32): AdminReports Page, AdminUsers Page, DocumentsModal Component, API: approveUser, API: banUser, API: deleteReport, API: deleteReportAdmin, API: deleteUser (+24 more)

### Community 2 - "Spring Boot Admin & Report Controllers"
Cohesion: 0.10
Nodes (4): AdminController, ReportController, build, ReportRepository

### Community 3 - "Frontend NPM Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, lucide-react, react, react-dom, react-router-dom, devDependencies, autoprefixer, eslint (+18 more)

### Community 4 - "Patient Report Submission Flow"
Cohesion: 0.10
Nodes (13): SendToDoctorModal(), ReportsContext, ReportsProvider(), useReports(), CONDITION_INFO, CONFIDENCE_COLORS, MyReports(), typeIcon (+5 more)

### Community 5 - "Spring Boot Auth Layer"
Cohesion: 0.10
Nodes (5): BackendApplication, AuthController, ComplaintController, UserController, UserRepository

### Community 6 - "Python CRUD Backend (Unused)"
Cohesion: 0.13
Nodes (12): create_report(), LoginSchema, Message, MessageSchema, register(), RegisterSchema, Report, ReportSchema (+4 more)

### Community 7 - "Frontend API Client Layer"
Cohesion: 0.22
Nodes (19): AdminComplaints Page, AdminDashboard Page, AdminLayout Component, Admin API Endpoints, API Client (api.js), Auth API Endpoints (login/register), Complaint API Endpoints, Message API Endpoints (+11 more)

### Community 8 - "AI Feature Pages"
Cohesion: 0.16
Nodes (17): AIDiagnosis Patient Page, AI Service /classify Endpoint, AI Service /enhance Endpoint, AI Service /measure-fluid Endpoint, DoctorEnhancement Page, FluidQuantification Patient Page, Spring Boot Maven Help, ImageEnhancement Patient Page (+9 more)

### Community 9 - "Spring Boot Controller Core"
Cohesion: 0.19
Nodes (16): AdminController, AuthController, Spring Boot BackendApplication, ComplaintController, LoginRequest DTO, RegisterRequest DTO, Complaint JPA Entity, Message JPA Entity (+8 more)

### Community 10 - "AI Service ML Models"
Cohesion: 0.18
Nodes (14): AI Service FastAPI App, Classification Model (MobileNetV3-based), classify_image Endpoint, enhance_image Endpoint, build_fluid_unet (U-Net Model Builder), measure_fluid Endpoint, Python Backend FastAPI App (main.py), LoginSchema Pydantic Model (+6 more)

### Community 14 - "Frontend Build Config"
Cohesion: 0.50
Nodes (4): BackendApplicationTests, ESLint Config, Frontend package.json, Vite Config

### Community 15 - "Frontend Static Assets"
Cohesion: 0.50
Nodes (4): Frontend HTML Entry Point, React Logo SVG, Vite + React README, Vite Logo SVG

## Ambiguous Edges - Review These
- `BackendApplicationTests` → `Vite Config`  [AMBIGUOUS]
  backend/backend/src/test/java/com/oct/backend/BackendApplicationTests.java · relation: conceptually_related_to

## Knowledge Gaps
- **70 isolated node(s):** `LoginRequest`, `RegisterRequest`, `name`, `private`, `version` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `BackendApplicationTests` and `Vite Config`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `build` connect `Spring Boot Admin & Report Controllers` to `Spring Boot Auth Layer`, `Frontend NPM Dependencies`, `Spring Security Config`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `scripts` connect `Frontend NPM Dependencies` to `Spring Boot Admin & Report Controllers`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `AdminController` connect `Spring Boot Admin & Report Controllers` to `Spring Boot Auth Layer`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `build` (e.g. with `.filterChain()` and `.getUserDocuments()`) actually correct?**
  _`build` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `AdminUsers Page` (e.g. with `Admin Role & Approval Flow` and `Doctor Registration Approval Flow`) actually correct?**
  _`AdminUsers Page` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `LoginRequest`, `RegisterRequest`, `name` to the rest of the system?**
  _72 weakly-connected nodes found - possible documentation gaps or missing edges._