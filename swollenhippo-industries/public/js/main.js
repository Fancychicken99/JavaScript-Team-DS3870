"use strict";
const objForm = document.querySelector("#contact-form");
const objSummary = document.querySelector("#error-summary");
const objErrorList = document.querySelector("#error-list");
const objStatus = document.querySelector("#form-status");
const objButton = document.querySelector("#submit-button");
const arrFields = [
  { strId: "name", strLabel: "Full name" }, { strId: "email", strLabel: "Work email" },
  { strId: "company", strLabel: "Company or organization" }, { strId: "service", strLabel: "Primary service needed" },
  { strId: "message", strLabel: "Project details" }
];
objForm.addEventListener("submit", async (objEvent) => {
  objEvent.preventDefault();
  objSummary.hidden = true; objErrorList.replaceChildren(); objStatus.textContent = "";
  let intErrors = 0;
  for (const objField of arrFields) {
    const objInput = document.getElementById(objField.strId);
    const objError = document.getElementById(objField.strId + "-error");
    objInput.removeAttribute("aria-invalid"); objError.hidden = true; objError.textContent = "";
    let strMessage = "";
    if (objInput.required && !objInput.value.trim()) strMessage = "Complete this field.";
    else if (objInput.validity.typeMismatch) strMessage = "Enter an email address such as name@example.com.";
    else if (objInput.maxLength > 0 && objInput.value.length > objInput.maxLength) strMessage = "Use " + objInput.maxLength + " characters or fewer.";
    if (!strMessage) continue;
    intErrors++; objInput.setAttribute("aria-invalid", "true"); objError.textContent = strMessage; objError.hidden = false;
    const objItem = document.createElement("li"); const objLink = document.createElement("a");
    objLink.href = "#" + objField.strId; objLink.textContent = objField.strLabel + ": " + strMessage;
    objLink.addEventListener("click", (objClickEvent) => { objClickEvent.preventDefault(); objInput.focus(); });
    objItem.append(objLink); objErrorList.append(objItem);
  }
  if (intErrors) { objSummary.hidden = false; objSummary.focus(); return; }
  if (!objSession.fnToken()) { objStatus.textContent = "Please sign in or create an account using the account link above this form. Your entries will stay here."; objStatus.focus(); return; }
  objButton.disabled = true; objStatus.textContent = "Sending your inquiry…";
  try {
    const objJob = await objSession.fnRequest("/api/jobs", { method: "POST", body: JSON.stringify({
      strCustomerName: objForm.elements.name.value, strEmail: objForm.elements.email.value,
      strCompany: objForm.elements.company.value, strService: objForm.elements.service.value, strDetails: objForm.elements.message.value
    }) });
    objStatus.textContent = "Inquiry #" + objJob.intJobId + " was saved. Its status is Pending. View it on your dashboard; we will add an expected completion date after review.";
    objForm.reset(); objStatus.focus();
  } catch (objError) { objStatus.textContent = objError.message; objStatus.focus(); }
  finally { objButton.disabled = false; }
});
objForm.noValidate = true; objButton.disabled = false;

// Keep the draft within this browser tab while the customer signs in.
try {
  const objDraft = JSON.parse(sessionStorage.getItem("hippo-draft") || "{}");
  for (const objField of arrFields) if (typeof objDraft[objField.strId] === "string") document.getElementById(objField.strId).value = objDraft[objField.strId];
} catch { sessionStorage.removeItem("hippo-draft"); }
objForm.addEventListener("input", () => {
  const objDraft = Object.fromEntries(arrFields.map((objField) => [objField.strId, document.getElementById(objField.strId).value]));
  sessionStorage.setItem("hippo-draft", JSON.stringify(objDraft));
});
objForm.addEventListener("reset", () => sessionStorage.removeItem("hippo-draft"));
