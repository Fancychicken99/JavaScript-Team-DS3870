# Prompt record for the repository completion session

This file records the current engineering request and clarification. It is not a complete record of the team's earlier AI usage. Teammates must supply their actual earlier Codex and prompt-generation chats, with their own reasons for choosing those prompts. Do not invent missing history.

## User engineering request

> You are an expert full-stack software engineer and system architect. Your objective is to unify, repair, and complete a Node.js/Express and MariaDB web application prior to its strict Monday deadline (October 12, 2026).
>
> Execute the following comprehensive engineering tasks with absolute precision, adhering strictly to the project's technical specifications and constraints:
>
> ### 1. Repository Cleanup & Stack Standardization
> - Purge all legacy C#/.NET files (including Program.cs and invalid project files) from the repository.
> - Completely remove all residual merge conflict markers (<<<<<<<, =======, >>>>>>>) across all files.
> - Establish Node.js with Express as the exclusive backend framework inside server.js, ensuring it handles static files, API routing, and database integration natively.
>
> ### 2. Database & Data Layer (MariaDB)
> - Implement a robust MariaDB connection module using the appropriate Node driver (e.g., mysql2 or mariadb).
> - Create or verify database schema models for:
>   - 'users': Stores administrator credentials with secure password hashing.
>   - 'jobs': Stores intJobId, strCustomerName, strDetails, strStatus ('Pending', 'InProgress', 'Complete', 'Shipped'), dteExpectedCompletion, and dteCreated.
> - Write backend routes to safely persist job inquiries submitted from the frontend.
>
> ### 3. Frontend, UI, & Branding
> - Integrate Bootstrap seamlessly into all HTML views.
> - Ensure the primary color palette strictly uses Earth Tones (browns, creams, olives) with zero gradients, glowing effects, or AI-styled visuals.
> - Properly wire up and reference the 'Swollenhippo_logo.png' and favicon across the application layout.
> - Rewrite the frontend JavaScript (main.js) inquiry form submission logic to send a valid POST request to the Express backend instead of a dead stub.
> - Implement a customer dashboard view displaying job listings, current statuses, and expected completion dates.
>
> ### 4. Authentication, Security, & Testing
> - Implement secure admin authentication middleware and login endpoints to protect status update operations.
> - Ensure 100% WCAG 2.2 accessibility compliance, explicit form labeling, visible focus indicators, and full keyboard navigability.
> - Set up an automated testing suite (using Jest or Mocha/Supertest) to validate core API endpoints for job creation, retrieval, and status updates.
>
> Please generate the necessary code modifications, refactored server.js, database migration/connection scripts, updated frontend scripts, and dashboard markup required to make this project immediately ready for production submission.

## Database clarification

Assistant asked whether a local MariaDB instance with a disposable test database was available.

User response:

> It just needs to be able to easily be connected to an active/deployed mariaDB database later

## Implementation rationale recorded by the assistant

- Extend the existing Node/Sequelize/MariaDB implementation instead of maintaining a second backend. The earlier update had already removed the .NET files.
- Preserve the existing Users/Jobs tables and physical legacy columns; expose the requested Hungarian-named job attributes through model mappings and additive columns so an existing deployment does not lose records.
- Require customer accounts for private job lists. Server-side ownership is derived from authentication, never trusted from submitted JSON.
- Recheck account roles in the database on protected requests so demoting an administrator immediately prevents further updates.
- Serve Bootstrap locally so the restrictive same-origin security policy remains effective and the interface does not depend on a CDN.
- Preserve the team's existing logo from Dev rather than inventing replacement artwork.
- Use real Express routes with an isolated database adapter for API/browser tests. Provide a separate opt-in live MariaDB smoke test because the user deferred connecting a database.
- Treat automated WCAG checks as evidence only; retain a manual accessibility verification checklist rather than claiming certification.

These are the assistant's engineering reasons, not a claim about each teammate's motivation or contribution. The team should add its own prompt-selection explanations before submission.
