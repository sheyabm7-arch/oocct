# OCT-Platform — Local Run Guide

> Environment set up automatically. **No source code was modified.** Only tooling
> was installed and the broken `ai-service/venv` was repaired (it had been built
> on another machine / Python 3.11).

## Installed tooling

| Tool        | Version / Location                                                    |
|-------------|-----------------------------------------------------------------------|
| Node.js     | v24.15.0 (`C:\Program Files\nodejs`)                                   |
| JDK         | 21.0.11 (`C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot`)          |
| Python      | 3.11.9 (used by the ai-service venv) + 3.12 (system)                  |
| PostgreSQL  | 16 — service `postgresql-x64-16`, port 5432                            |

## Database (already created)

- DB name: `oct_platform`
- User: `postgres`  ·  Password: `Ww123321`  ·  `localhost:5432`
- Matches `backend/backend/src/main/resources/application.properties`
  (Spring `ddl-auto=update` creates the tables on first run).

## The real stack

`frontend/src/api.js` → `http://localhost:9000` = **Java Spring Boot backend**
and `http://localhost:8001` = **ai-service**.
> `backend/main.py` is an unused Python/FastAPI duplicate — ignore it.

## Admin role (added 2026-05-16)

- A 3rd role **ADMIN** was added. Default admin is auto-seeded on first
  backend start: **`admin@oct.com` / `admin123`** (login via the normal
  login page → Admin Portal).
- **Doctor approval flow**: a new doctor registers with status `PENDING`
  and **cannot log in** until an admin approves them; patients only see
  approved doctors. Patients/admin are `ACTIVE` immediately.
- Admin portal: Dashboard (stats) + Manage Users (approve / reject /
  delete, filter by role / pending).
- New endpoints: `/api/admin/users`, `/api/admin/stats`,
  `/api/admin/users/{id}/approve|reject`, `DELETE /api/admin/users/{id}`.
- **Reports & complaints (added 2026-05-16):**
  - Admin → All Reports: list every medical report, delete any.
  - Doctor → in a report's View modal: "Report this patient to admin"
    (files a complaint with a reason).
  - Admin → Complaints: list complaints (who/why), **Ban User**
    (status `BANNED` → blocked at login), dismiss, or delete.
  - Admin → Manage Users: Ban / Unban + red `banned` badge.
  - **Ban is a separate flag from approval status** (added 2026-05-16):
    banning a PENDING doctor keeps status=PENDING (Approve/Reject stay
    visible); Unban returns the doctor to PENDING so the admin can still
    approve/reject the entry request. Banning an APPROVED doctor keeps
    status=ACTIVE. `User.banned` boolean is independent of
    `User.status` (PENDING/ACTIVE/REJECTED). Endpoints
    `PUT /api/admin/users/{id}/ban|unban`.
  - Endpoints: `GET/DELETE /api/admin/reports[/{id}]`,
    `POST /api/complaints`, `GET /api/admin/complaints`,
    `PUT /api/admin/users/{id}/ban`,
    `PUT /api/admin/complaints/{id}/resolve`,
    `DELETE /api/admin/complaints/{id}`.
- **Doctor verification documents (added 2026-05-16):** at registration a
  doctor must upload 3 images — (1) national ID/passport,
  (2) ophthalmology specialty certificate, (3) current practice license.
  Stored base64 on `users` (idDocument / specialtyCertificate /
  practiceLicense). Register is rejected (400) for a doctor missing any.
  Admin → Manage Users → pending doctor has a **Documents** button that
  opens a modal showing the 3 images with Approve / Reject.
  Endpoint: `GET /api/admin/users/{id}/documents`; users list now also
  returns `hasDocuments`.
- Verified end-to-end via API (register→pending→403→approve→login→visible;
  report→admin-delete; complaint→ban→403→unban→login;
  doctor-no-docs→400, doctor-3-docs→pending→docs visible→approve→login).
- Test accounts `doc*@test.com` / `pat*@test.com` may exist in the DB from
  testing — delete them from the Admin → Manage Users page if you want.

---

## How to run (3 terminals)

### 1. ai-service  (port 8001)
```powershell
cd F:\OCT-Platform\ai-service
.\venv\Scripts\python.exe app.py
```

### 2. Java backend  (port 9000)
```powershell
cd F:\OCT-Platform\backend\backend
$env:JAVA_HOME='C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot'
.\mvnw.cmd spring-boot:run
```
(or run the built jar: `java -jar target\backend-0.0.1-SNAPSHOT.jar`)

### 3. frontend  (Vite dev server)
```powershell
cd F:\OCT-Platform\frontend
npm run dev
```
Then open the URL Vite prints (default http://localhost:5173).

---

## Notes
- Open `OCT-Platform.code-workspace` in VS Code for the 3-folder workspace +
  recommended extensions (Java Pack, Spring Boot, Python, ESLint).
- ai-service first request loads two `.h5` models — first call is slow.
- Harmless warning on ai-service start: NumPy 1.24 vs SciPy — does not affect
  the endpoints; left as-is because TensorFlow 2.13 requires NumPy < 1.25.
- Start order: PostgreSQL (auto) → ai-service → Java backend → frontend.
