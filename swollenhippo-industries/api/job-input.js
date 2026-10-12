"use strict";
const arrServices = ["manufacturing", "electronics", "software", "design", "multidisciplinary"];
function fnText(objBody, strKey, intMax, blnRequired = true) {
  const strValue = objBody[strKey];
  return typeof strValue === "string" && strValue.trim().length <= intMax && (!blnRequired || strValue.trim().length > 0);
}
function fnValidInquiry(objBody) {
  return fnText(objBody, "strCustomerName", 100) && fnText(objBody, "strEmail", 254) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(objBody.strEmail) && fnText(objBody, "strDetails", 2000) &&
    arrServices.includes(objBody.strService) &&
    (objBody.strCompany === undefined || fnText(objBody, "strCompany", 150, false));
}
function fnInquiryValues(objBody) {
  // Whitelist editable fields. Never accept ownership, status, or scheduling from an inquiry body.
  return {
    Title: objBody.strService,
    strCustomerName: objBody.strCustomerName.trim(),
    strEmail: objBody.strEmail.trim(),
    strCompany: (objBody.strCompany || "").trim(),
    strService: objBody.strService,
    strDetails: objBody.strDetails.trim()
  };
}
module.exports = { fnValidInquiry, fnInquiryValues };
