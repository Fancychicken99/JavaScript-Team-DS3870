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


## Follow-up request for CRUD completion and visual refinement

User request:

> You are an expert full-stack developer acting as a junior software engineering assistant. Your task is to implement, refactor, and finalize a Node.js/Express and MariaDB web application for a team business project, aligning with industry standards and the specific learning objectives of this course.
>
> Approach this task with absolute precision, directness, and adherence to the specifications below.
>
> ### 1. Architectural & Stack Specifications
> - Backend Framework: Use Node.js with Express exclusively.
> - Database Layer: MariaDB storage with clean initialization/migration SQL scripts included.
> - Authentication: Implement a secure authentication method (e.g., session IDs or JSON Web Tokens) to protect administrative status updates.
> - Core Functionality: A complete CRUD application allowing customers to submit job inquiries, view job tracking status ('Pending', 'InProgress', 'Complete', 'Shipped') with expected completion dates, and allow authenticated administrators to update them.
>
> ### 2. Coding Conventions & Code Quality
> - Hungarian Notation: Strictly name all variables using Hungarian notation with clear, contextual meaning (e.g., strCustomerName, intJobId, objDatabasePool, blnIsAuthenticated).
> - Readability Over Efficiency: Prioritize clean, easy-to-read, and maintainable code over micro-optimizations.
> - Comments: Add clear code comments explaining any obscure or difficult programming logic.
> - Granular Changes: Apply requested changes and bug fixes at the smallest level available to avoid unnecessary regressions.
>
> ### 3. UI, UX, Branding, & Accessibility (WCAG 2.2)
> - **Branding (logo):** Make the existing Swollen Hippo logo significantly larger and a focal point of the application's visual hierarchy. Ensure it is prominently displayed in the header and on key pages. Properly reference 'Swollenhippo_logo.png' and the favicon.
> - **Visual Appeal & Engagement:**
>     - Integrate a sophisticated implementation of Bootstrap to structure the application.
>     - Utilize a strictly controlled, expert-level Earth Tone color palette (browns, creams, olives) as the foundation.
>     - Apply advanced CSS techniques such as subtle backgrounds (textures or patterns in Earth Tones), CSS shaders (applied responsibly for effects that do not use prohibited gradients or glowing), well-defined content boxes with visible borders or padding, and clean typography.
>     - **Forbidden Elements:** Absolutely NO glowing effects, gradients, or AI-styled visuals that deviate from the requested non-digital, hand-drawn aesthetic.
> - **Accessibility:** Ensure 100% WCAG 2.2 compliance, including full keyboard-only navigability across all interactive elements, visible focus indicators, and explicit form labels.
>
> ### 4. Testing & Iteration Protocol
> - Automated Testing: Write and include an automated test suite (using Jest or Mocha/Supertest) covering core API endpoints and closest neighboring features.
> - Iteration: If tests fail, analyze the failure directly, apply precise fixes at the smallest level, and re-test until green.
>
> ### 5. Pedagogical Context & Deliverable Awareness
> Remember that this project is designed to bridge business acumen with agentic software engineering. As an AI assistant, you are supporting a team completing a resume-worthy CRUD application emphasizing user experience, secure authentication research, version-controlled collaboration, and structured prompt documentation.
>
> Please generate the complete, production-ready code files—including server.js, database setup scripts, authentication middleware, updated frontend scripts (main.js), CSS/SASS files incorporating the advanced styling, and dashboard views—needed to unify and complete this application.

Assistant implementation rationale: retain the working authentication/inquiry foundation; add the missing administrative edit/delete operations using shared field validation; preserve the team's schema and dashboard helper work; make branding visibly larger through CSS and layout changes; provide explicit additive MariaDB SQL; and test permission boundaries, browser flows, focus recovery, and deletion cancellation. The user should add their own explanation of why they chose this prompt. Automated accessibility checks do not establish complete WCAG conformance; live MariaDB remains deferred by the user's earlier instruction.

## Deployment and cross-browser follow-up (October 13, 2026)

Actual user prompts included:

- "can we include playwright testing as well"
- "I would like to check all popular browsers via playwright testing aswell can we include that in step 3b also"
- "can you just create an entire pasteable scripts/test-browser.js"
- "I have been specifically instructed that a reverse proxy is necessary is that true here"
- "okay go ahead and check the repository and tell me where I need to go from here"
- "can you do all of this for me"

Assistant rationale: retain the existing isolated workflow while selecting one browser per run to reduce memory use; store screenshots by browser; replace a timing-sensitive immediate input read with Playwright's retrying assertion without weakening the expected value; trust only the local Nginx proxy; preserve database credentials outside Git; and record deployment evidence separately from unverified manual checks. Chromium, Firefox, WebKit, Chrome, and Edge passes were supplied in VM transcripts. Database authentication, HTTPS, renewal simulation, and service restart evidence were also supplied.

This is a selected record, not an export of every prompt. The team still needs to attach its original conversations (with secrets redacted), its own prompt-selection explanations, and authentic teammate contribution/evaluation records. Do not include passwords exposed during troubleshooting. The assistant cannot author personal evaluations or invent motivations for teammates.
