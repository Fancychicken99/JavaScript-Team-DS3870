"use strict";

const form = document.querySelector("#contact-form");
const summary = document.querySelector("#error-summary");
const errorList = document.querySelector("#error-list");
const status = document.querySelector("#form-status");
const fields = [
  { id: "name", label: "Full name", missing: "Enter your full name." },
  { id: "email", label: "Work email", missing: "Enter your work email." },
  { id: "company", label: "Company or organization" },
  { id: "service", label: "Primary service needed", missing: "Choose a service." },
  { id: "message", label: "Project details", missing: "Describe your project goals, timeframe, or requirements." }
];

form.addEventListener("submit", (event) => {
  // Local demo only: prevent navigation and never transmit entered data.
  event.preventDefault();
  summary.hidden = true;
  errorList.replaceChildren();
  status.textContent = "";
  let errorCount = 0;

  for (const field of fields) {
    const input = document.getElementById(field.id);
    const error = document.getElementById(`${field.id}-error`);
    input.removeAttribute("aria-invalid");
    error.hidden = true;
    error.textContent = "";

    let message = "";
    if (input.required && !input.value.trim()) message = field.missing;
    else if (input.validity.typeMismatch) message = "Enter an email address such as name@example.com.";
    else if (input.maxLength > 0 && input.value.length > input.maxLength) {
      message = `Use ${input.maxLength} characters or fewer.`;
    }
    if (!message) continue;

    errorCount += 1;
    input.setAttribute("aria-invalid", "true");
    error.textContent = `Error: ${message}`;
    error.hidden = false;
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${field.id}`;
    link.textContent = `${field.label}: ${message}`;
    link.addEventListener("click", (clickEvent) => {
      clickEvent.preventDefault();
      input.focus();
    });
    item.append(link);
    errorList.append(item);
  }

  if (errorCount) {
    summary.hidden = false;
    summary.focus();
  } else {
    status.textContent = "Your project details passed the demonstration checks. No request was sent or saved, and no consultation was scheduled.";
  }
});

// Clear stale success feedback when entries change.
form.addEventListener("input", () => { status.textContent = ""; });
form.addEventListener("change", () => { status.textContent = ""; });
// Enable custom validation only once its handler is attached.
form.noValidate = true;
document.querySelector("#submit-button").disabled = false;