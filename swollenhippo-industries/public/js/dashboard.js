"use strict";
const objAccountForm = document.querySelector("#account-form");
const objAccountStatus = document.querySelector("#account-status");
const objAccountPanel = document.querySelector("#account-panel");
const objJobsPanel = document.querySelector("#jobs-panel");
const objJobsStatus = document.querySelector("#jobs-status");
const objJobList = document.querySelector("#job-list");
let intOffset = 0;
let arrPageJobs = [];
const objStatusLabels = objDashboardUtils.objStatusLabels;
function fnElement(strTag, strText, strClass = "") {
  const objElement = document.createElement(strTag); objElement.textContent = strText; objElement.className = strClass; return objElement;
}
function fnShowAccount() {
  objJobsPanel.hidden = true; objAccountPanel.hidden = false; objJobList.replaceChildren();
}
function fnInquiryEditor(objJob) {
  const objDetails = document.createElement("details");
  objDetails.className = "inquiry-editor";
  objDetails.append(fnElement("summary", "Edit inquiry #" + objJob.intJobId));
  const objForm = document.createElement("form");
  const arrFields = [
    { strKey: "strCustomerName", strLabel: "Customer name", strType: "text", intMax: 100 },
    { strKey: "strEmail", strLabel: "Customer email", strType: "email", intMax: 254 },
    { strKey: "strCompany", strLabel: "Company (optional)", strType: "text", intMax: 150 },
    { strKey: "strService", strLabel: "Service", strType: "select" },
    { strKey: "strDetails", strLabel: "Project details", strType: "textarea", intMax: 2000 }
  ];
  for (const objField of arrFields) {
    const objWrapper = fnElement("div", "", "field");
    const objLabel = fnElement("label", objField.strLabel + " for inquiry #" + objJob.intJobId);
    const strTag = ["select", "textarea"].includes(objField.strType) ? objField.strType : "input";
    const objInput = document.createElement(strTag);
    objInput.id = "edit-" + objJob.intJobId + "-" + objField.strKey;
    objInput.name = objField.strKey; objLabel.htmlFor = objInput.id;
    objInput.required = objField.strKey !== "strCompany";
    if (strTag === "input") objInput.type = objField.strType;
    if (strTag === "textarea") objInput.rows = 5;
    if (objField.intMax) objInput.maxLength = objField.intMax;
    if (strTag === "select") {
      for (const [strValue, strLabel] of Object.entries({ manufacturing: "Manufacturing", electronics: "Electronics", software: "Software", design: "Design", multidisciplinary: "Multidisciplinary" })) {
        const objOption = fnElement("option", strLabel); objOption.value = strValue; objInput.append(objOption);
      }
    }
    objInput.value = objJob[objField.strKey] || "";
    objWrapper.append(objLabel, objInput); objForm.append(objWrapper);
  }
  const objSave = fnElement("button", "Save inquiry #" + objJob.intJobId); objSave.type = "submit";
  const objFeedback = fnElement("p", ""); objFeedback.setAttribute("role", "status"); objFeedback.tabIndex = -1;
  objForm.append(objSave, objFeedback);
  objForm.addEventListener("submit", async (objEvent) => {
    objEvent.preventDefault(); objSave.disabled = true; objFeedback.textContent = "Saving inquiry…";
    const objBody = Object.fromEntries(arrFields.map((objField) => [objField.strKey, objForm.elements[objField.strKey].value]));
    try {
      await objSession.fnRequest("/api/jobs/" + objJob.intJobId, { method: "PATCH", body: JSON.stringify(objBody) });
      await fnLoadJobs(); objJobsStatus.textContent = "Inquiry #" + objJob.intJobId + " updated."; objJobsStatus.focus();
    } catch (objError) { objFeedback.textContent = objError.message; objFeedback.focus(); }
    finally { objSave.disabled = false; }
  });
  objDetails.append(objForm);
  return objDetails;
}
function fnDeleteButton(objJob) {
  const objButton = fnElement("button", "Delete job #" + objJob.intJobId, "button-danger");
  objButton.type = "button";
  objButton.addEventListener("click", async () => {
    // A native confirmation provides an explicit, keyboard-accessible cancel path.
    if (!window.confirm("Permanently delete job #" + objJob.intJobId + " for " + objJob.strCustomerName + "? This cannot be undone.")) return;
    objButton.disabled = true;
    try {
      await objSession.fnRequest("/api/jobs/" + objJob.intJobId, { method: "DELETE" });
      await fnLoadJobs(); objJobsStatus.textContent = "Job #" + objJob.intJobId + " deleted."; objJobsStatus.focus();
    } catch (objError) { objJobsStatus.textContent = objError.message; objJobsStatus.focus(); }
    finally { objButton.disabled = false; }
  });
  return objButton;
}
function fnRenderJob(objJob) {
  const objColumn = fnElement("div", "", "col-12 col-lg-6");
  const objArticle = fnElement("article", "", "job-card h-100");
  objArticle.dataset.status = objJob.strStatus;
  objArticle.append(fnElement("h3", "Job #" + objJob.intJobId + " · " + objJob.strCustomerName));
  objArticle.append(fnElement("p", "Status: " + objStatusLabels[objJob.strStatus], "job-status"));
  objArticle.append(fnElement("p", "Expected completion: " + (objJob.dteExpectedCompletion || "To be scheduled")));
  objArticle.append(fnElement("p", "Submitted: " + new Date(objJob.dteCreated).toLocaleDateString()));
  objArticle.append(fnElement("p", objJob.strDetails, "job-details"));
  if (objSession.fnUser()?.role === "Admin") {
    objArticle.append(fnElement("p", "Contact: " + objJob.strEmail + (objJob.strCompany ? " · " + objJob.strCompany : "")));
    const objForm = document.createElement("form");
    const objLabel = fnElement("label", "Status for job #" + objJob.intJobId);
    const objSelect = document.createElement("select"); objSelect.id = "status-" + objJob.intJobId; objLabel.htmlFor = objSelect.id;
    for (const [strValue, strLabel] of Object.entries(objStatusLabels)) {
      const objOption = fnElement("option", strLabel); objOption.value = strValue; objSelect.append(objOption);
    }
    objSelect.value = objJob.strStatus;
    const objDateLabel = fnElement("label", "Expected completion for job #" + objJob.intJobId + " (optional)");
    const objDate = document.createElement("input"); objDate.type = "date"; objDate.min = "1000-01-01"; objDate.max = "9999-12-31";
    objDate.id = "date-" + objJob.intJobId; objDateLabel.htmlFor = objDate.id; objDate.value = objJob.dteExpectedCompletion || "";
    const objButton = fnElement("button", "Save job #" + objJob.intJobId); objButton.type = "submit";
    const objFeedback = fnElement("p", ""); objFeedback.setAttribute("role", "status");
    objForm.append(objLabel, objSelect, objDateLabel, objDate, objButton, objFeedback);
    objForm.addEventListener("submit", async (objEvent) => {
      objEvent.preventDefault(); objButton.disabled = true; objFeedback.textContent = "Saving…";
      try {
        const objUpdated = await objSession.fnRequest("/api/jobs/" + objJob.intJobId + "/status", { method: "PATCH", body: JSON.stringify({ strStatus: objSelect.value, dteExpectedCompletion: objDate.value || null }) });
        objArticle.querySelector(".job-status").textContent = "Status: " + objStatusLabels[objUpdated.strStatus];
        objArticle.querySelector(".job-status").nextElementSibling.textContent = "Expected completion: " + (objUpdated.dteExpectedCompletion || "To be scheduled");
        objArticle.dataset.status = objUpdated.strStatus;
        objJob.strStatus = objUpdated.strStatus; objJob.dteExpectedCompletion = objUpdated.dteExpectedCompletion;
        const objCounts = objDashboardUtils.fnCountJobs(arrPageJobs);
        for (const [strStatus, intCount] of Object.entries(objCounts)) document.getElementById("count-" + strStatus).textContent = intCount;
        objFeedback.textContent = "Job updated.";
      } catch (objError) { objFeedback.textContent = objError.message; }
      finally { objButton.disabled = false; }
    });
    objArticle.append(objForm, fnInquiryEditor(objJob), fnDeleteButton(objJob));
  }
  objColumn.append(objArticle); return objColumn;
}
function fnRenderPage() {
  const arrSelectedJobs = objDashboardUtils.fnSelectJobs(arrPageJobs,
    document.querySelector("#job-filter").value,
    document.querySelector("#job-search").value,
    document.querySelector("#job-sort").value);
  const objCounts = objDashboardUtils.fnCountJobs(arrPageJobs);
  for (const [strStatus, intCount] of Object.entries(objCounts)) document.getElementById("count-" + strStatus).textContent = intCount;
  objJobList.replaceChildren(...arrSelectedJobs.map(fnRenderJob));
  objJobsStatus.textContent = arrSelectedJobs.length + " of " + arrPageJobs.length + " jobs shown on this page.";
  if (!arrPageJobs.length) objJobsStatus.textContent = "No jobs on this page.";
  else if (!arrSelectedJobs.length) objJobsStatus.textContent = "No jobs match these filters. Clear the search or choose another status.";
}
async function fnLoadJobs() {
  if (!objSession.fnToken()) { fnShowAccount(); return; }
  objAccountPanel.hidden = true; objJobsPanel.hidden = false;
  objAccountStatus.textContent = "Signed in as " + (objSession.fnUser()?.username || "customer") + ".";
  const blnAdmin = objSession.fnUser()?.role === "Admin";
  document.querySelector("#dashboard-title").textContent = blnAdmin ? "Project administration" : "Your job dashboard";
  document.querySelector("#jobs-title").textContent = blnAdmin ? "All customer jobs" : "Your jobs";
  document.querySelector("#new-inquiry").hidden = blnAdmin;
  objJobsStatus.textContent = "Loading jobs…";
  document.querySelector("#refresh").disabled = true;
  document.querySelector("#previous").disabled = true; document.querySelector("#next").disabled = true;
  try {
    const arrJobs = await objSession.fnRequest("/api/jobs?offset=" + intOffset);
    arrPageJobs = arrJobs;
    fnRenderPage();
    document.querySelector("#previous").disabled = intOffset === 0;
    document.querySelector("#next").disabled = arrJobs.length < 50;
    document.querySelector("#page-label").textContent = "Page " + (intOffset / 50 + 1);
  } catch (objError) {
    objJobList.replaceChildren(); objJobsStatus.textContent = objError.message;
    if (!objSession.fnToken()) { fnShowAccount(); objAccountStatus.textContent = objError.message; objAccountStatus.focus(); }
  } finally { document.querySelector("#refresh").disabled = false; }
}
objAccountForm.addEventListener("submit", async (objEvent) => {
  objEvent.preventDefault();
  const strAction = objEvent.submitter?.value || "login";
  const arrButtons = objAccountForm.querySelectorAll("button"); arrButtons.forEach((objButton) => { objButton.disabled = true; });
  objAccountStatus.textContent = strAction === "login" ? "Signing in…" : "Creating account…";
  try {
    const objData = await objSession.fnRequest("/api/auth/" + strAction, { method: "POST", body: JSON.stringify({ username: objAccountForm.elements.username.value, password: objAccountForm.elements.password.value }) });
    objAccountForm.elements.password.value = "";
    if (strAction === "register") { objAccountStatus.textContent = objData.message; objAccountForm.elements.password.focus(); }
    else { objSession.fnSave(objData); intOffset = 0; await fnLoadJobs(); objAccountStatus.focus(); }
  } catch (objError) { objAccountStatus.textContent = objError.message; objAccountStatus.focus(); }
  finally { arrButtons.forEach((objButton) => { objButton.disabled = false; }); }
});
document.querySelector("#logout").addEventListener("click", () => { objSession.fnClear(); fnShowAccount(); objAccountStatus.textContent = "Signed out on this device."; objAccountForm.elements.username.focus(); });
document.querySelector("#refresh").addEventListener("click", fnLoadJobs);
document.querySelector("#previous").addEventListener("click", async () => { intOffset = Math.max(0, intOffset - 50); await fnLoadJobs(); objJobsStatus.focus(); });
document.querySelector("#next").addEventListener("click", async () => { intOffset += 50; await fnLoadJobs(); objJobsStatus.focus(); });
fnLoadJobs();

for (const strId of ["job-search", "job-filter", "job-sort"]) document.getElementById(strId).addEventListener(strId === "job-search" ? "input" : "change", fnRenderPage);
