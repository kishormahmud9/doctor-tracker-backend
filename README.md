# Doctor Tracker - Backend API

Production-ready Node.js, Express, and TypeScript backend service for Doctor Tracker.

## Architecture

```text
backend/
├── src/
│   ├── config/             # Environment, database, and configuration loaders
│   ├── controllers/        # Request handlers (auth, doctor, patient, dashboard, health)
│   ├── middleware/         # Express middlewares (auth, validation, error, notFound)
│   ├── models/             # Mongoose schemas and data models (Admin, Doctor, Patient)
│   ├── routes/             # API endpoint definitions (auth, doctor, patient, dashboard, health, index)
│   ├── scripts/            # CLI scripts (seedAdmin)
│   ├── services/           # Business logic (authService, doctorService, patientService, dashboardService)
│   ├── tests/              # Automated test suites (auth, doctor, patient, dashboard)
│   ├── types/              # TypeScript declarations and express extensions
│   ├── utils/              # Helper functions and logger
│   ├── validators/         # Input and query validation rules (auth, doctor, patient, dashboard)
│   ├── app.ts              # Express application setup
│   └── server.ts           # Server bootstrap and lifecycle management
├── dist/                   # Compiled JavaScript output
├── eslint.config.mjs       # ESLint flat configuration
├── package.json            # Backend dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Prerequisites

- Node.js >= 18.x (v22.x recommended)
- MongoDB instance (MongoDB Atlas Cluster0 with `doctorDB` or local MongoDB)
- npm >= 9.x

## Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Configuration keys:

| Variable | Description | Default | Required in Production |
|---|---|---|---|
| `PORT` | Port the Express server listens on | `5000` | No |
| `MONGODB_URI` | MongoDB connection URI (`doctorDB` database) | `mongodb://localhost:27017/doctorDB` | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | `default_jwt_secret_change_in_production` (dev only) | **Yes (>= 32 chars)** |
| `JWT_EXPIRES_IN` | JWT token expiration duration (`24h`, `1d`, `7d`, etc.) | `24h` | No |
| `BCRYPT_SALT_ROUNDS` | Salt rounds / work factor for bcrypt hashing | `12` | No |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:3000` | Yes |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` | No |
| `ADMIN_NAME` | Optional default name for non-interactive admin seeding | - | No |
| `ADMIN_EMAIL` | Optional default email for non-interactive admin seeding | - | No |
| `ADMIN_PASSWORD` | Optional default password for non-interactive admin seeding | - | No |

> **Security Note:** In production mode (`NODE_ENV=production`), the application validates `JWT_SECRET` on startup and refuses to run if it is unset, uses a placeholder, or is shorter than 32 characters.

## Available Scripts

- `npm run dev`: Runs the backend in development mode with `tsx watch` (automatic hot reload)
- `npm run build`: Compiles TypeScript source files to JavaScript in `./dist`
- `npm start`: Starts the compiled production server from `./dist/server.js`
- `npm run lint`: Runs ESLint over `./src`
- `npm test`: Runs automated integration and unit test suites sequentially with isolated databases
- `npm run seed:admin`: Creates the initial administrator account securely

---

## Admin Seed Script

Initial admin accounts can be provisioned using the dedicated `seed:admin` command. Default production passwords are never created or assumed.

### 1. Using CLI Arguments

```bash
npm run seed:admin -- --name "Dr. Jane Doe" --email "jane.doe@hospital.org" --password "YourStrongPassword123!"
```

Or using positional arguments:

```bash
npm run seed:admin -- "Dr. Jane Doe" "jane.doe@hospital.org" "YourStrongPassword123!"
```

### 2. Using Environment Variables

```bash
ADMIN_NAME="System Administrator" ADMIN_EMAIL="admin@hospital.org" ADMIN_PASSWORD="YourStrongPassword123!" npm run seed:admin
```

On Windows PowerShell:

```powershell
$env:ADMIN_NAME="System Administrator"; $env:ADMIN_EMAIL="admin@hospital.org"; $env:ADMIN_PASSWORD="YourStrongPassword123!"; npm run seed:admin
```

### 3. Interactive Input

When run in an interactive terminal without parameters, the script securely prompts for Name, Email, and Password:

```bash
npm run seed:admin
```

### Duplicate Handling & Safety

- Duplicate email addresses are handled gracefully: if an admin with that email already exists, the script warns and terminates with code 0 without modifying the database or leaking secrets.
- Passwords and password hashes are never logged to console output.
- The script operates standalone and is **never** executed automatically when starting the web server.

---

## Authentication Endpoints

Base path: `/api/auth`

### 1. Admin Login

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Authentication**: None (Public)

#### Request Body

```json
{
  "email": "admin@hospital.org",
  "password": "YourStrongPassword123!"
}
```

#### Successful Response (`200 OK`)

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "6abe312ee262d60515ff192b",
      "name": "Dr. Jane Doe",
      "email": "admin@hospital.org",
      "createdAt": "2026-10-01T10:00:00.000Z",
      "updatedAt": "2026-10-01T10:00:00.000Z"
    }
  }
}
```

#### Validation Error (`400 Bad Request`)

```json
{
  "status": "fail",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" },
    { "field": "password", "message": "Password is required" }
  ]
}
```

#### Invalid Credentials (`401 Unauthorized`)

```json
{
  "status": "fail",
  "message": "Invalid email or password"
}
```

---

### 2. Current Authenticated Profile

- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
- **Authentication**: Bearer JWT Required

#### Successful Response (`200 OK`)

```json
{
  "status": "success",
  "data": {
    "admin": {
      "id": "6abe312ee262d60515ff192b",
      "name": "Dr. Jane Doe",
      "email": "admin@hospital.org",
      "createdAt": "2026-10-01T10:00:00.000Z",
      "updatedAt": "2026-10-01T10:00:00.000Z"
    }
  }
}
```

---

## Doctor Management Endpoints

Base path: `/api/doctors`

All Doctor endpoints require an active administrator JWT: `Authorization: Bearer <JWT_TOKEN>`

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/doctors` | Creates a new doctor record | `201`, `400`, `401`, `409` |
| `GET` | `/api/doctors` | Paginated listing with search & filters | `200`, `400`, `401` |
| `GET` | `/api/doctors/:id` | Retrieves single doctor by MongoDB ID | `200`, `400`, `401`, `404` |
| `PATCH` | `/api/doctors/:id` | Partial update of doctor fields | `200`, `400`, `401`, `404`, `409` |
| `DELETE` | `/api/doctors/:id` | Deletes doctor (verifies safe deletion policy) | `200`, `400`, `401`, `404` |

#### `GET /api/doctors` Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | Integer | `1` | Page number (must be >= 1) |
| `limit` | Integer | `10` | Number of items per page (1 - 100) |
| `search` | String | - | Case-insensitive search across name, specialization, hospital, and email |
| `specialization` | String | - | Filter by exact (case-insensitive) specialization |
| `hospital` | String | - | Filter by exact (case-insensitive) hospital |
| `startDate` | ISO Date String | - | Filter records created on or after date (`YYYY-MM-DD` or full ISO) |
| `endDate` | ISO Date String | - | Filter records created on or before date |

#### Doctor Deletion Safety Policy

A doctor **cannot** be deleted while associated patient records exist in the database.
Attempting to delete a doctor with active patients returns HTTP 400:
```json
{
  "status": "fail",
  "message": "Cannot delete doctor with 3 associated patient(s). Reassign or delete associated patients first."
}
```
This prevents cascading deletions and preserves patient record integrity.

---

## Patient Management Endpoints

Base path: `/api/patients`

All Patient endpoints require an active administrator JWT: `Authorization: Bearer <JWT_TOKEN>`

### Patient Model Schema & Assumptions

The Patient entity is stored in its own dedicated collection `patients`:

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | String | Yes | Patient full name (2 - 120 chars, trimmed) |
| `age` | Number | Yes | Patient age (integer between 0 and 130) |
| `gender` | String | Yes | Demographic gender (`male`, `female`, or `other`) |
| `phone` | String | Yes | Contact telephone number (7 - 25 chars) |
| `condition` | String | Yes | Primary medical condition / diagnosis (2 - 100 chars, indexed) |
| `doctorId` | ObjectId | Yes | Foreign key reference to associated Doctor (indexed) |
| `email` | String | No | Optional patient email address (validated format, normalized) |
| `createdAt` | Date | Auto | Timestamp of record creation |
| `updatedAt` | Date | Auto | Timestamp of last record update |

---

### Patient API Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/patients` | Creates a patient under an existing doctor | `201`, `400`, `401`, `404` |
| `GET` | `/api/patients` | Paginated listing with search & filters | `200`, `400`, `401` |
| `GET` | `/api/patients/:id` | Retrieves single patient by ID | `200`, `400`, `401`, `404` |
| `PATCH` | `/api/patients/:id` | Partial update of allowed patient fields | `200`, `400`, `401`, `404` |
| `DELETE` | `/api/patients/:id` | Deletes a single patient | `200`, `400`, `401`, `404` |

#### `GET /api/patients` Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | Integer | `1` | Page number (`>= 1`) |
| `limit` | Integer | `10` | Page size (`1` to `100` max) |
| `search` | String | - | Case-insensitive search on `name`, `condition`, `phone`, and `email` |
| `doctorId` | ObjectId | - | Filter patients assigned to a specific doctor |
| `condition` | String | - | Filter patients by medical condition (case-insensitive) |
| `startDate` | ISO Date String | - | Records created on or after date (`YYYY-MM-DD` or full ISO) |
| `endDate` | ISO Date String | - | Records created on or before date |

---

### Doctor-to-Patient Relationship Endpoints

Base path: `/api/doctors/:id/patients`

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/doctors/:id/patients` | Returns paginated patients for a specific doctor | `200`, `400`, `401`, `404` |
| `POST` | `/api/doctors/:id/patients` | Creates a patient associated with `:id` (overrides body `doctorId`) | `201`, `400`, `401`, `404` |
| `DELETE` | `/api/doctors/:doctorId/patients/:patientId` | Deletes a patient confirming ownership by `:doctorId` | `200`, `400`, `401`, `404` |

---

## Dashboard Analytics & Data Visualization Endpoints

Base path: `/api/dashboard`

All Dashboard endpoints require an active administrator JWT: `Authorization: Bearer <JWT_TOKEN>`.

### 1. Dashboard Summary

- **Method**: `GET`
- **URL**: `/api/dashboard/summary`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Optional Query Parameters**:
  - `startDate`: ISO or `YYYY-MM-DD` date string
  - `endDate`: ISO or `YYYY-MM-DD` date string

#### Response (`200 OK`)

```json
{
  "status": "success",
  "data": {
    "totalDoctors": 12,
    "totalPatients": 48,
    "averagePatientsPerDoctor": 4.0,
    "range": {
      "startDate": "2026-09-01",
      "endDate": "2026-10-01",
      "doctorsInRange": 3,
      "patientsInRange": 15
    }
  }
}
```

---

### 2. Patients Per Doctor

- **Method**: `GET`
- **URL**: `/api/dashboard/patients-per-doctor`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`

#### Aggregation Strategy
- Uses an efficient MongoDB aggregation pipeline starting from the `doctors` collection.
- Uses `$lookup` with a scoped subpipeline (`$match: { $expr: { $eq: ["$doctorId", "$$docId"] } }`) and `$count: "count"`.
- Prevents memory bloat by **never** loading patient documents into memory.
- Preserves doctors with zero patients (`patientCount: 0`) using `$ifNull`.
- Avoids double-counting by strictly binding patients to their unique `doctorId`.
- Sorted by `patientCount` descending, tie-broken by `doctorName` ascending.

#### Response (`200 OK`)

```json
{
  "status": "success",
  "data": {
    "doctors": [
      {
        "doctorId": "674dd8731fa19024f2249e01",
        "doctorName": "Dr. Gregory House",
        "specialization": "Diagnostics",
        "hospital": "Princeton-Plainsboro",
        "patientCount": 18
      },
      {
        "doctorId": "674dd8731fa19024f2249e02",
        "doctorName": "Dr. Lisa Cuddy",
        "specialization": "Endocrinology",
        "hospital": "Princeton-Plainsboro",
        "patientCount": 0
      }
    ],
    "totalDoctors": 2
  }
}
```

---

### 3. Date-Based Registration Statistics

- **Method**: `GET`
- **URL**: `/api/dashboard/date-statistics`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Query Parameters**:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `startDate` | ISO / `YYYY-MM-DD` | - | Start of timestamp range (`createdAt >= startDate`) |
| `endDate` | ISO / `YYYY-MM-DD` | - | End of timestamp range (`createdAt <= endDate`) |
| `groupBy` | String | `day` | Grouping interval: `day` (`YYYY-MM-DD`) or `month` (`YYYY-MM`) |
| `timezone` | String | `UTC` | Target timezone for grouping (default `UTC`) |

#### Timezone & Date Semantics
- Dates are evaluated in **UTC** by default.
- If `startDate` or `endDate` are given as `YYYY-MM-DD`, `startDate` starts at `00:00:00.000Z` and `endDate` covers up to `23:59:59.999Z`.
- Uses MongoDB `$dateToString` aggregation operator with indexed `createdAt: -1` boundary filtering.
- Merges doctor creations and patient creations into a unified, ascending chronological timeline ready for data visualization charts (e.g., Recharts, Chart.js).

#### Response (`200 OK`)

```json
{
  "status": "success",
  "data": {
    "timeline": [
      {
        "date": "2026-09-28",
        "doctorsCreated": 2,
        "patientsCreated": 5
      },
      {
        "date": "2026-09-29",
        "doctorsCreated": 1,
        "patientsCreated": 8
      }
    ],
    "summary": {
      "groupBy": "day",
      "timezone": "UTC",
      "startDate": "2026-09-28",
      "endDate": "2026-09-29",
      "totalDoctorsInRange": 3,
      "totalPatientsInRange": 13
    }
  }
}
```

---

## Example cURL Requests

### Get Dashboard Summary
```bash
curl -X GET "http://localhost:5000/api/dashboard/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Patients Per Doctor
```bash
curl -X GET "http://localhost:5000/api/dashboard/patients-per-doctor" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Date Statistics Grouped by Day
```bash
curl -X GET "http://localhost:5000/api/dashboard/date-statistics?groupBy=day&startDate=2026-09-01&endDate=2026-10-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Security Considerations

1. **Strict Admin Authentication**: All doctor, patient, doctor-to-patient, and dashboard analytics endpoints require a signed, unexpired administrator Bearer JWT.
2. **Referential Integrity**: Patients can only be created with, or reassigned to, verified existing Doctor ObjectIds.
3. **No Cascading Deletions**: Deletion of a doctor is blocked whenever active patient records reference that doctor.
4. **Ownership Verification**: Deleting a patient through a scoped doctor route (`DELETE /api/doctors/:doctorId/patients/:patientId`) strictly verifies that the patient belongs to that specific doctor before deletion.
5. **Mass-Assignment Protection**: Update endpoints reject/ignore attempts to modify internal fields (`_id`, `__v`, `createdAt`, `updatedAt`).
6. **Optimized Indexes & Query Execution**:
   - Single and compound indexes on `doctorId`, `condition`, and `createdAt` ensure efficient querying and sorting without collection scans.
   - Analytics aggregations utilize `$count` subpipelines and indexed date filters, preventing memory exhaustion and avoiding N+1 queries.
7. **Input Validation**: Request bodies and query parameters are strictly bounded (pagination limited to max 100 items, date formats validated, ranges enforced).
8. **Logging Hygiene**: Sensitive health and credential information is never logged.
