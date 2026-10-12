"use strict";
const objSession = {
  fnToken() { return sessionStorage.getItem("hippo-token") || ""; },
  fnClear() { sessionStorage.removeItem("hippo-token"); sessionStorage.removeItem("hippo-user"); },
  fnUser() { try { return JSON.parse(sessionStorage.getItem("hippo-user") || "null"); } catch { return null; } },
  fnSave(objData) { sessionStorage.setItem("hippo-token", objData.accessToken); sessionStorage.setItem("hippo-user", JSON.stringify(objData.user)); },
  async fnRequest(strUrl, objOptions = {}) {
    const objResponse = await fetch(strUrl, { ...objOptions, headers: {
      "Content-Type": "application/json", ...(this.fnToken() ? { Authorization: "Bearer " + this.fnToken() } : {}), ...objOptions.headers
    } });
    const objData = await objResponse.json();
    if (!objResponse.ok) {
      if (objResponse.status === 401) this.fnClear();
      throw new Error(objData.message || "Unable to complete the request.");
    }
    return objData;
  }
};
