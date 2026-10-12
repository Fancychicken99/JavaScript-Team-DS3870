# SwollenHippo Express API

Run all commands from the swollenhippo-industries directory. See the root README for setup, MariaDB connection, administrator creation, and validation.

All request/response bodies are JSON. Authenticated endpoints require Authorization: Bearer <accessToken>. Tokens expire after two hours. Responses are not cached.

| Method | Path | Access | Behavior |
| --- | --- | --- | --- |
| POST | /api/auth/register | Public, rate limited | username and password; creates a Customer only |
| POST | /api/auth/login | Public, rate limited | username and password; returns accessToken and user |
| POST | /api/jobs | Customer | Persists a pending inquiry owned by the signed-in customer |
| GET | /api/jobs?offset=0 | Authenticated | Customer's own jobs, or all jobs for an administrator; 50 per page |
| GET | /api/jobs/my-jobs | Authenticated | Compatibility alias for the job listing |
| PATCH | /api/jobs/:id/status | Admin only | Updates strStatus and optionally dteExpectedCompletion |

Inquiry body:

~~~json
{
  "strCustomerName": "Customer Name",
  "strEmail": "customer@example.com",
  "strCompany": "Optional company",
  "strService": "design",
  "strDetails": "Build a prototype enclosure."
}
~~~

Services: manufacturing, electronics, software, design, multidisciplinary. Names are limited to 100 characters, email to 254, company to 150, and project details to 2000. The authenticated user determines ownership. Status and expected completion cannot be supplied by customers.

Administrator update body:

~~~json
{"strStatus":"InProgress","dteExpectedCompletion":"2026-10-20"}
~~~

Statuses: Pending, InProgress, Complete, Shipped. A null completion date means To be scheduled. Omit the date to retain the current value. Impossible calendar dates are rejected.

400 means invalid input, 401 means authentication required/expired, 403 means unauthorized role, 404 means missing resource, 409 means duplicate username, 413 means an oversized body, and 429 means rate limited. Database failures return a generic 500 and never a success message.

The database is queried on every protected request to enforce current account existence and role. Password hashes and user records are never included in job responses. Database operations use Sequelize parameterization over the MariaDB driver.


## Complete inquiry CRUD

PATCH /api/jobs/:id requires an Admin token and the complete inquiry body shown above. Only customer name, email, company, service, details, and the legacy title are updated. Ownership, status, and expected completion are never accepted by this endpoint. Use the separate status endpoint for scheduling/status changes.

DELETE /api/jobs/:id requires an Admin token and permanently removes that job. The dashboard asks for explicit confirmation and offers cancellation before making the request. Missing/deleted records return 404; customer accounts cannot edit or delete any job, including their own. Deletion failures never return success.
