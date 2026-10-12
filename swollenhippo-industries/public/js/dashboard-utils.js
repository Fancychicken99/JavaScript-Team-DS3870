"use strict";
const objDashboardUtils = (() => {
  const objStatusLabels = Object.freeze({ Pending: "Pending", InProgress: "In progress", Complete: "Complete", Shipped: "Shipped" });
  const objServiceLabels = Object.freeze({ manufacturing: "Additive & subtractive manufacturing", electronics: "Electronics & PCB design", software: "Software & firmware development", design: "Digital & industrial design", multidisciplinary: "Multidisciplinary prototyping" });
  function fnSelectJobs(arrJobs, strStatus = "all", strQuery = "", strOrder = "newest") {
    const strSearch = strQuery.trim().toLocaleLowerCase();
    const arrStatuses = Object.keys(objStatusLabels);
    return arrJobs.filter((objJob) => (strStatus === "all" || objJob.strStatus === strStatus) &&
      [objJob.intJobId, objJob.strCustomerName, objJob.strCompany, objServiceLabels[objJob.strService] || objJob.strService, objJob.strDetails, objJob.Title].join(" ").toLocaleLowerCase().includes(strSearch)).sort((objLeft, objRight) => {
      let intDifference = 0;
      if (strOrder === "status") intDifference = arrStatuses.indexOf(objLeft.strStatus) - arrStatuses.indexOf(objRight.strStatus);
      else if (strOrder === "completion") intDifference = (objLeft.dteExpectedCompletion || "9999-12-31").localeCompare(objRight.dteExpectedCompletion || "9999-12-31");
      else intDifference = (Date.parse(objLeft.dteCreated) - Date.parse(objRight.dteCreated)) * (strOrder === "oldest" ? 1 : -1);
      return intDifference || objRight.intJobId - objLeft.intJobId;
    });
  }
  function fnCountJobs(arrJobs) {
    const objCounts = { Pending: 0, InProgress: 0, Complete: 0, Shipped: 0 };
    for (const objJob of arrJobs) if (Object.hasOwn(objCounts, objJob.strStatus)) objCounts[objJob.strStatus]++;
    return objCounts;
  }
  function fnDate(strValue, blnDateOnly = false) {
    if (!strValue) return "To be scheduled";
    const objDate = new Date(strValue);
    if (!Number.isFinite(objDate.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", ...(blnDateOnly ? { timeZone: "UTC" } : {}) }).format(objDate);
  }
  return { objStatusLabels, objServiceLabels, fnSelectJobs, fnCountJobs, fnDate };
})();
if (typeof module !== "undefined" && module.exports) module.exports = objDashboardUtils;