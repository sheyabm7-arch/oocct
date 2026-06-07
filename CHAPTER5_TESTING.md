# CHAPTER 5

## TESTING AND EVALUATION

To ensure the system meets medical, production, and usability standards, testing was performed on the
**OCT Analysis Platform** throughout its development. Because the platform is a medical decision-support
tool, correctness and safety were treated as priorities. Testing was carried out using **manual
functional testing** of every feature in a running environment, together with a dedicated **evaluation of
the AI classification model** on a held-out test set. The following two sections explain the strategies
followed for the web application (Backend & Frontend) and for the AI Engine respectively.

---

### 5.1 Backend & Frontend

The web application was validated through **manual functional testing**: each feature was exercised in a
running instance of the system (the Spring Boot backend, the React frontend, and the PostgreSQL database
running together), and its actual behavior was observed and compared against the expected behavior across
the three roles — PATIENT, DOCTOR, and ADMIN.

The following areas were tested manually:

- **Authentication & Authorization:** registering a patient (instant activation) and a doctor (pending
  admin approval), logging in to receive a JWT, and confirming that a pending, rejected, or banned account
  is correctly denied access. It was also verified that each role only reaches the pages and endpoints it
  is allowed to (for example, an admin approving a doctor before that doctor can log in).

- **Password Recovery (OTP):** the full flow was tested end-to-end — requesting a reset, **receiving the
  6-digit OTP by real email**, entering it within the validity window, and successfully setting a new
  password. Expired codes and already-used codes were confirmed to be rejected.

- **Reports & AI Features:** uploading an OCT image to the AI Diagnosis, Image Enhancement, and Fluid
  Quantification pages, confirming the result is displayed correctly, that the uploaded image is saved to
  the patient's private gallery, and that a report can be sent to a doctor and then reviewed by that
  doctor.

- **Real-time Messaging:** verified that a message sent by one user appears **instantly** on the other
  user's screen without refreshing, by logging in as a patient and a doctor at the same time and
  exchanging messages over the WebSocket connection.

- **Doctor Profile, Ratings & Location:** editing the professional profile, adding certificates and
  skills, pinning the clinic location on the map, submitting a star rating as a patient, and confirming
  the rating and reviews appear on the doctor's public profile.

- **Interface options:** switching the interface between **English and Arabic** (including the
  right-to-left layout) and toggling **dark mode**, confirming the choice persists.

These manual tests were repeated whenever a feature was changed, to make sure existing functionality
continued to work after each update.

---

### 5.2 AI Engine

- **Model Accuracy Evaluation:** the OCT classification model was evaluated on a held-out **test set**
  organized into the four classes (**CNV, DME, DRUSEN, NORMAL**). Each test image was passed through the
  same preprocessing and inference pipeline used in production, and the predicted label was compared
  against the true label. The results were summarized using a **Classification Report** — reporting the
  **precision, recall, and F1-score** for each class along with the macro and weighted averages — and a
  **Confusion Matrix**, which shows exactly which classes the model tends to confuse. This allows the
  model's reliability to be judged per disease rather than relying on overall accuracy alone.

- **AI Service Integration Verification:** the connection to the external services was verified directly.
  The **Gemini** model integration used by the chatbot was tested to confirm the correct model and API key
  return a valid response, and the **email (SMTP)** integration used for the OTP feature was tested to
  confirm that messages are actually delivered to the user's inbox.

- **Failure Handling:** the conversational assistant was checked to confirm that when the Gemini provider
  is unavailable or rejects a request, the backend returns a safe fallback message instead of exposing a
  raw error, so the user experience is not interrupted.

---

**These testing activities ensured that every feature of the platform behaves correctly for each role,
that the core integrations (email and AI) work end-to-end, and that the classification model's accuracy
was measured objectively before relying on its output.**
