# DairyTrack Pro

A full-stack web application for managing day-to-day dairy farm
operations in one place.

**GitHub:** https://github.com/chandru1227/DairyTrack-Pro\
**Frontend:** https://dairy-track-pro-rose.vercel.app/\
**Backend API:** https://dairytrack-pro-backend.onrender.com

## Overview

DairyTrack Pro aims to replace scattered manual dairy records with a
centralized system for livestock, milk production, milker attendance and
salary, inventory, expenses, customers, sales, dashboards, and reports.

## Technology Stack

-   **Frontend:** React, Vite, JavaScript
-   **Backend:** Java 21, Spring Boot 4.1.1, REST APIs
-   **Persistence:** Spring Data JPA, Hibernate
-   **Database:** MySQL 8
-   **Security:** Spring Security, session-based authentication, CSRF
    protection
-   **Hosting:** Vercel (frontend), Render (backend), Aiven MySQL
    (database)
-   **Version control:** Git and GitHub

## Architecture

``` text
Browser
  -> React + Vite frontend (Vercel)
  -> Spring Boot REST API (Render)
  -> Spring Data JPA / Hibernate
  -> MySQL database (Aiven)
```

The frontend presents screens and sends API requests. The backend
validates requests, identifies the authenticated user, enforces
permissions and business rules, and persists data in MySQL.

## Main Features

-   Owner and milker authentication with role-based access.
-   Livestock/cow record management.
-   Milk production recording by cow, date, morning/evening session, and
    quantity.
-   Personal milk-record history for milkers and farm-wide visibility
    for the owner.
-   Milker profiles, attendance, salary earned, and salary payments.
-   Inventory and expenses.
-   Customer and sales-related records.
-   Dashboard totals and business reports.

Verify each module in the deployed version before describing it as
production-ready.

## Important Business Rules

-   Each cow can have at most one morning entry and one evening entry
    per date.
-   Duplicate prevention is global across milkers, not just per account.
-   New milk entries are linked to the authenticated user who recorded
    them.
-   Historical entries without a recorder should remain unattributed
    unless reliable evidence identifies the original user.
-   Owner-wide views should remain available to the owner; milker views
    should be restricted to that milker's records.
-   Zero-litre entries are intended to be supported, but test the
    frontend and backend validation before claiming this behaviour is
    verified.
-   Attendance and salary changes must be authorized on the backend, not
    merely hidden in the UI.

## Local Development

### Prerequisites

-   Java 21
-   Node.js and npm
-   MySQL 8
-   Git

### Backend

1.  Create a local MySQL database named `dairytrack_db`.
2.  Open a terminal in `dairytrack/`.
3.  Set the local database password as an environment variable. Do not
    commit credentials.
4.  Run:

``` cmd
mvnw.cmd spring-boot:run
```

The local backend is configured for port `8081`. Review
`dairytrack/src/main/resources/application.properties` for the current
database configuration.

### Frontend

1.  Open a terminal in `dairytrack-frontend/`.
2.  Install dependencies and start Vite:

``` bash
npm install
npm run dev
```

Vite commonly serves the frontend at `http://localhost:5173`. Check the
current API proxy/rewrite configuration before testing locally.

## Deployment

-   Push reviewed changes to the `main` branch on GitHub.
-   Confirm the latest commit and deployment status in Render.
-   Confirm the Vercel project root is `dairytrack-frontend`, build
    command is `npm run build`, and output directory is `dist`.
-   Confirm `/api` requests route to the Render backend.
-   Keep database passwords, session cookies, tokens, and other secrets
    in hosting environment settings. Never commit them.
-   After deployment, test login, role restrictions, milk recording,
    duplicate rejection, owner visibility, and reports.

## Verification Notes

In local testing, owner and milker authentication worked. Sankar saved a
10-litre COW-001 morning entry for 20 October 2026. The owner could see
the same entry, a second milker's duplicate attempt was rejected, and a
database query confirmed the entry was associated with user `sankar`.
Zero-litre acceptance and all attendance/salary self-service permissions
still require separate verification.

## Repository Structure

``` text
DairyTrack-Pro/
├── dairytrack/             # Spring Boot backend
└── dairytrack-frontend/    # React + Vite frontend
```

## Future Improvements

-   Automated tests for business rules, repository queries, and
    authorization.
-   End-to-end tests for zero-litre entries and cross-user duplicate
    attempts.
-   Milker self-service attendance/salary views with strict server-side
    ownership checks.
-   API documentation, monitoring, and a production database
    backup/migration strategy.

