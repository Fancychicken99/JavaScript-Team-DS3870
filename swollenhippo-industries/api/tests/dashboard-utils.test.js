"use strict";
const { it: fnTest } = require("mocha");
const objAssert = require("node:assert/strict");
const objUtils = require("../../public/js/dashboard-utils");
const arrJobs = [
  { intJobId: 1, strCustomerName: "Test customer", strService: "design", strDetails: "Enclosure", strStatus: "Pending", dteCreated: "2026-10-01", dteExpectedCompletion: null },
  { intJobId: 2, strCustomerName: "Test customer", strService: "electronics", strDetails: "Sensor PCB", strStatus: "InProgress", dteCreated: "2026-10-02", dteExpectedCompletion: "2026-10-20" },
  { intJobId: 3, strCustomerName: "Test customer", strService: "software", strDetails: "Firmware", strStatus: "Complete", dteCreated: "2026-10-03", dteExpectedCompletion: "2026-10-15" },
  { intJobId: 4, strCustomerName: "Test customer", strService: "manufacturing", strDetails: "Fixture", strStatus: "Shipped", dteCreated: "2026-10-04", dteExpectedCompletion: "2026-10-12" }
];
fnTest("search uses real API names, business service labels and status", () => {
  objAssert.equal(objUtils.fnSelectJobs(arrJobs, "InProgress", " PCB ")[0].intJobId, 2);
  objAssert.equal(objUtils.fnSelectJobs(arrJobs, "Pending", "pcb").length, 0);
  objAssert.equal(objUtils.fnSelectJobs(arrJobs, "all", "industrial design")[0].intJobId, 1);
});
fnTest("sorts without modifying page data and puts unscheduled jobs last", () => {
  objAssert.deepEqual(objUtils.fnSelectJobs(arrJobs).map((objJob) => objJob.intJobId), [4, 3, 2, 1]);
  objAssert.deepEqual(objUtils.fnSelectJobs(arrJobs, "all", "", "completion").map((objJob) => objJob.intJobId), [4, 3, 2, 1]);
  objAssert.deepEqual(objUtils.fnSelectJobs(arrJobs, "all", "", "status").map((objJob) => objJob.intJobId), [1, 2, 3, 4]);
  objAssert.deepEqual(arrJobs.map((objJob) => objJob.intJobId), [1, 2, 3, 4]);
});
fnTest("totals and empty lists", () => {
  objAssert.deepEqual(objUtils.fnCountJobs(arrJobs), { Pending: 1, InProgress: 1, Complete: 1, Shipped: 1 });
  objAssert.deepEqual(objUtils.fnSelectJobs([]), []);
});
fnTest("date-only values retain calendar day", () => {
  objAssert.equal(objUtils.fnDate("2026-10-12", true), "Oct 12, 2026");
  objAssert.equal(objUtils.fnDate(null, true), "To be scheduled");
});