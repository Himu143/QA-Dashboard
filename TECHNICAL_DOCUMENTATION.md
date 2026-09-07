# Comprehensive Technical Documentation & Database Setup Guide
**Project:** QA Testing & Defect Management Dashboard  
**Architecture:** Full-Stack Reactive SPA (React 19 + TypeScript + Vite + Tailwind CSS v4 + Google Cloud Firestore)

---

## Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [System Architecture & Technology Stack](#2-system-architecture--technology-stack)
3. [Source Code Directory Structure](#3-source-code-directory-structure)
4. [Functional Modules & Capabilities](#4-functional-modules--capabilities)
5. [Database Architecture & Schema Reference](#5-database-architecture--schema-reference)
6. [Step-by-Step Database Setup Guide](#6-step-by-step-database-setup-guide)
7. [Security Rules & Data Governance](#7-security-rules--data-governance)
8. [Local Development & Deployment Guide](#8-local-development--deployment-guide)

---

## 1. Executive Summary & Purpose
The **QA Testing & Defect Management Dashboard** is a software quality assurance workspace. It unifies project tracking, test planning, step-by-step test execution, real-time bug reporting, and team audit logs into a high-performance single-page application.

Key objectives:
- **Zero-loss Data Persistence**: Real-time cloud sync with Firestore and optimistic client-side fallback.
- **Traceability**: Complete linkage between Projects &rarr; Test Plans &rarr; Test Cases &rarr; Test Runs &rarr; Defect Tickets &rarr; Audit Activities.
- **Immediate QA Feedback**: Live execution engine that lets testers convert failed test steps into pre-filled defect tickets in a single click.

---

## 2. System Architecture & Technology Stack

```
+-------------------------------------------------------------------------+
|                              Client Layer                               |
|   React 19 (Hooks, Functional Components, Lucide Icons, Recharts)       |
|   Tailwind CSS v4 (Design tokens & Utility styling)                     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                        Data Synchronization Layer                       |
|   src/lib/firebase.ts (Realtime Subscriptions, Optimistic State, Cache) |
+------------------+------------------------------------+-----------------+
                   |                                    |
                   v                                    v
+--------------------------------------+  +-------------------------------+
|       Firebase Firestore             |  |      Browser LocalStorage     |
|   (Remote Real-Time DB)              |  |   (Offline Resilience Engine) |
+--------------------------------------+  +-------------------------------+
```

### Core Technologies
- **UI Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5.8 (Strict Type Safety)
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Charts & Metrics**: Recharts 2.15
- **Animations**: Motion (`motion/react`)
- **Icons**: Lucide React (`lucide-react`)
- **Backend Database**: Firebase Firestore (Google Cloud Platform)

---

## 3. Source Code Directory Structure

```
├── .env.example                     # Environment variables template
├── firebase-blueprint.json          # Firestore Schema Blueprint
├── firestore.rules                  # Firestore Database Security Rules
├── metadata.json                    # Application metadata
├── package.json                     # Scripts and project dependencies
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite configuration
├── public/                          # Public static assets
└── src/
    ├── App.tsx                      # Root orchestration component & routing
    ├── main.tsx                     # Entry point mounting to DOM
    ├── index.css                    # Tailwind CSS v4 styling rules
    ├── types.ts                     # Core domain interfaces and schemas
    ├── components/
    │   ├── BugDetailModal.tsx       # Bug detail inspector, comments & workflow transitions
    │   ├── BugFormModal.tsx         # Bug reporting and editing modal
    │   ├── BugsList.tsx             # Defect tracking board (Kanban & Table views)
    │   ├── Dashboard.tsx            # Executive KPI metrics & analytical charts
    │   ├── Header.tsx               # Global search, project selector & quick actions
    │   ├── ProjectModal.tsx         # Project creation, editing & deletion modal
    │   ├── Sidebar.tsx              # Navigation bar, project catalog & team selector
    │   ├── TeamActivityFeed.tsx     # Chronological QA audit log
    │   ├── TestCaseModal.tsx        # Test case builder and step sequencer
    │   ├── TestCasesView.tsx        # Test case repository with CSV export
    │   ├── TestPlansView.tsx        # Test plan catalog & sprint management
    │   └── TestRunsAndReportsView.tsx # Live test execution runner & telemetry reports
    ├── data/
    │   └── seedData.ts              # Initial demo data & team profiles
    └── lib/
        ├── firebase.ts              # Firestore integration, listeners & storage fallback
        └── utils.ts                 # Utility formatting functions
```

---

## 4. Functional Modules & Capabilities

### 4.1 Project Management
- Custom key prefixes (e.g. `PAY`, `ECOM`, `AUTH`, `MOBILE`) applied to auto-generated ticket numbers.
- Full CRUD operations with color tags, assigned leads, and safe inline confirmation dialogs.

### 4.2 Defect Tracking
- **Multi-Layout Views**: Toggle between visual **Kanban columns** (`New`, `In Progress`, `Resolved`, `Closed`) and an **Interactive Table**.
- **Severity vs. Priority Matrix**: `Critical`/`High`/`Medium`/`Low` paired with `P0`/`P1`/`P2`/`P3`.
- **Reproducibility Details**: Steps to reproduce, expected vs. actual outcomes, environment targets (`Production`, `Staging`, `QA/Dev`, `Mobile`), and file attachments.
- **Collaboration**: Interactive comment threads with timestamped actor metadata.

### 4.3 Test Planning & Test Case Repository
- **Hierarchical Test Suites**: Group test cases by test plans and releases.
- **Precondition & Step Sequencing**: Step-by-step verification procedures with expected results.
- **CSV Data Export**: Export test case matrices for external compliance audits.

### 4.4 Live Test Execution Runner
- **Interactive Live Console**: Step-by-step verdicts (`Pass`, `Fail`, `Blocked`, `Skipped`) with execution notes.
- **One-Click Defect Filing**: Automatically pre-populates and opens a bug report modal directly from any failed test step.

---

## 5. Database Architecture & Schema Reference

The system utilizes Google Cloud Firestore organized into **7 top-level collections**:

### 5.1 Collection: `projects`
Stores high-level repository metadata.
```typescript
interface Project {
  id: string;               // Unique Document ID
  name: string;             // e.g. "Payment Gateway 2.0"
  key: string;              // e.g. "PAY"
  description: string;      // Summary of project scope
  color: string;            // HEX color tag (e.g. "#3B82F6")
  lead: string;             // Project lead name
  createdAt: string;        // ISO 8601 timestamp
  updatedAt?: string;       // ISO 8601 timestamp
}
```

### 5.2 Collection: `bugs`
Stores reported software defects.
```typescript
interface Bug {
  id: string;
  projectId: string;        // Foreign key -> projects.id
  bugNumber: string;        // Formatted code (e.g. "PAY-BUG-104")
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  environment: 'production' | 'staging' | 'dev' | 'mobile';
  assignedTo: string;
  reportedBy: string;
  tags?: string[];
  testCaseId?: string;      // Linked test case (if created from run)
  createdAt: string;
  updatedAt?: string;
}
```

### 5.3 Collection: `testPlans`
Stores QA test plan cycles and milestones.
```typescript
interface TestPlan {
  id: string;
  projectId: string;        // Foreign key -> projects.id
  planNumber: string;       // e.g. "PAY-TP-1"
  title: string;
  description: string;
  version: string;          // e.g. "v2.4.0"
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
}
```

### 5.4 Collection: `testCases`
Stores modular test specifications.
```typescript
interface TestCase {
  id: string;
  projectId: string;
  testPlanId?: string;
  caseNumber: string;       // e.g. "PAY-TC-101"
  title: string;
  preconditions: string;
  type: 'functional' | 'regression' | 'smoke' | 'performance' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'draft' | 'active' | 'deprecated';
  steps: {
    stepNumber: number;
    action: string;
    expectedResult: string;
  }[];
  createdBy: string;
  createdAt: string;
}
```

### 5.5 Collection: `testRuns`
Stores test execution telemetry and outcomes.
```typescript
interface TestRun {
  id: string;
  projectId: string;
  testPlanId?: string;
  runNumber: string;        // e.g. "PAY-RUN-401"
  title: string;
  environment: 'production' | 'staging' | 'dev' | 'mobile';
  executedBy: string;
  status: 'in_progress' | 'completed' | 'aborted';
  totalCases: number;
  passedCases: number;
  failedCases: number;
  blockedCases: number;
  caseResults: {
    testCaseId: string;
    status: 'passed' | 'failed' | 'blocked' | 'skipped';
    actualResult?: string;
    notes?: string;
  }[];
  createdAt: string;
  completedAt?: string;
}
```

### 5.6 Collection: `comments`
Stores threaded team comments on defects or test cases.
```typescript
interface Comment {
  id: string;
  entityType: 'bug' | 'testCase' | 'testPlan';
  entityId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}
```

### 5.7 Collection: `activities`
Stores real-time chronological event audit records.
```typescript
interface Activity {
  id: string;
  projectId?: string;
  entityType: 'bug' | 'testCase' | 'testPlan' | 'testRun' | 'project';
  entityId: string;
  entityTitle: string;
  actionType: 'created' | 'updated' | 'status_changed' | 'deleted' | 'executed';
  actorName: string;
  details: string;
  timestamp: string;
}
```

---

## 6. Step-by-Step Database Setup Guide

You can connect this application to either a **Managed Google Cloud Firestore project** or run it using its **Built-in LocalStorage Engine**.

### Option A: Connecting to Firebase Firestore (Cloud Database)

#### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name your project (e.g. `qa-dashboard-prod`).
3. Under the project menu, navigate to **Build &rarr; Firestore Database**.
4. Click **Create database**, choose a cloud region (e.g. `asia-southeast1` or `us-central1`), and start in **Production Mode**.

#### Step 2: Register a Web App
1. In your Firebase Project Overview, click the **Web icon (`</>`)** to register a web application.
2. Provide an app nickname and click **Register app**.
3. Firebase will present your configuration object with keys:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

#### Step 3: Configure Environment Variables
Create or edit your `.env` file in the project root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Step 4: Deploy Firestore Security Rules
Deploy the security rules from `firestore.rules` via the Firebase CLI:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to your Google account
firebase login

# Initialize and select Firestore
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

### Option B: Zero-Config Local Setup (Standalone Mode)
If no Firebase environment variables are provided, the application initializes its built-in reactive storage adapter (`src/lib/firebase.ts`).
- It automatically seeds initial demo data from `src/data/seedData.ts`.
- All operations (creating bugs, editing projects, deleting test cases) persist in browser local storage.
- You can reset the database to factory settings anytime using the **"Reset Demo Data"** button in the sidebar.

---

## 7. Security Rules & Data Governance

The `firestore.rules` configuration secures collection access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Configurable for specific IAM / Auth roles
    }
  }
}
```

*For enterprise production environments requiring authenticated access, update rules to enforce user token verification:*
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /bugs/{bugId} {
      allow read, write: if request.auth != null;
    }
    match /testPlans/{planId} {
      allow read, write: if request.auth != null;
    }
    match /testCases/{caseId} {
      allow read, write: if request.auth != null;
    }
    match /testRuns/{runId} {
      allow read, write: if request.auth != null;
    }
    match /comments/{commentId} {
      allow read, write: if request.auth != null;
    }
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false; // Audit logs are immutable
    }
  }
}
```

---

## 8. Local Development & Deployment Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to view the running application.

### 3. Run Static Code Analysis / Linter
```bash
npm run lint
```

### 4. Build for Production Deployment
```bash
npm run build
```
The compiled, production-ready server and static assets will be output to the `/dist` directory.

---

## 9. Backend Architecture & REST API Reference

The project includes an **Express.js full-stack backend** running with Vite middleware integration.

### Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server uptime and health probe status |
| `GET` | `/api/projects` | List all QA projects |
| `POST` | `/api/projects` | Create a new project repository |
| `PUT` | `/api/projects/:id` | Update project metadata |
| `DELETE` | `/api/projects/:id` | Remove a project |
| `GET` | `/api/bugs` | Retrieve bug defect tickets with filter parameters |
| `POST` | `/api/bugs` | File a new software defect ticket |
| `PUT` | `/api/bugs/:id` | Update bug details |
| `PATCH` | `/api/bugs/:id/status` | Quick status transition with resolution notes |
| `DELETE` | `/api/bugs/:id` | Delete a defect ticket |
| `GET` | `/api/test-plans` | Retrieve QA test plans |
| `POST` | `/api/test-plans` | Create a test plan specification |
| `GET` | `/api/test-cases` | List test cases with optional plan or project filters |
| `GET` | `/api/test-cases/export` | Download complete test suite as CSV |
| `POST` | `/api/test-cases` | Create a structured test case |
| `GET` | `/api/test-runs` | Retrieve execution runs |
| `POST` | `/api/test-runs` | Record test execution results and sync case statuses |
| `GET` | `/api/activities` | Audit trail and team activity log |
| `GET` | `/api/stats/dashboard` | Aggregated QA KPI metrics and pass rates |
| `POST` | `/api/ai/analyze-defect` | Server-side Gemini AI bug defect analysis & triage |
| `POST` | `/api/ai/generate-test-cases` | Server-side Gemini AI user story test case synthesis |

