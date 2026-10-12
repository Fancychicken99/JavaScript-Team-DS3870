"use strict";
const objAccountForm = document.querySelector("#account-form");
const objAccountStatus = document.querySelector("#account-status");
const objAccountPanel = document.querySelector("#account-panel");
const objJobsPanel = document.querySelector("#jobs-panel");
const objJobsStatus = document.querySelector("#jobs-status");
const objJobList = document.querySelector("#job-list");
let intOffset = 0;
const objStatusLabels = { Pending: "Pending", InProgress: "In progress", Complete: "Complete", Shipped: "Shipped" };
function fnElement(strTag, strText, strClass = "") {
  const objElement = document.createElement(strTag); objElement.textContent = strText; objElement.className = strClass; return objElement;
}
function fnShowAccount() {
  objJobsPanel.hidden = true; objAccountPanel.hidden = false; objJobList.replaceChildren();
}
function fnRenderJob(objJob) {
  const objColumn = fnElement("div", "", "col-12 col-lg-6");
  const objArticle = fnElement("article", "", "job-card h-100");
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
        objFeedback.textContent = "Job updated.";
      } catch (objError) { objFeedback.textContent = objError.message; }
      finally { objButton.disabled = false; }
    });
    objArticle.append(objForm);
  }
  objColumn.append(objArticle); return objColumn;
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
    objJobList.replaceChildren(...arrJobs.map(fnRenderJob));
    objJobsStatus.textContent = arrJobs.length ? arrJobs.length + (arrJobs.length === 1 ? " job shown." : " jobs shown.") : "No jobs on this page. Submit an inquiry to get started.";
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
