"use strict";
const objExpress = require("express");
const fnHelmet = require("helmet");
const objPath = require("node:path");
const { rateLimit: fnRateLimit } = require("express-rate-limit");
const { fnGetJwtConfig } = require("./api/config");

function fnCreateApp(objDatabase = require("./models")) {
  const objApp = objExpress();
  const blnProduction = process.env.NODE_ENV === "production";
  objApp.disable("x-powered-by");
  objApp.use(fnHelmet({
    strictTransportSecurity: blnProduction ? undefined : false,
    contentSecurityPolicy: { directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'"], imgSrc: ["'self'"], fontSrc: ["'self'"],
      connectSrc: ["'self'"], objectSrc: ["'none'"], baseUri: ["'none'"],
      formAction: ["'self'"], frameAncestors: ["'none'"],
      upgradeInsecureRequests: blnProduction ? [] : null
    } }
  }));
  objApp.use(objExpress.json({ limit: "16kb" }));
  objApp.use("/api", (objRequest, objResponse, fnNext) => {
    objResponse.set("Cache-Control", "no-store");
    fnNext();
  });
  objApp.use("/api/auth", fnRateLimit({ windowMs: 15 * 60 * 1000, limit: 50,
    standardHeaders: "draft-8", legacyHeaders: false,
    message: { message: "Too many account requests. Please try again in 15 minutes." }
  }), require("./api/routes/auth")(objDatabase));
  objApp.use("/api/jobs", fnRateLimit({ windowMs: 60 * 1000, limit: 120,
    standardHeaders: "draft-8", legacyHeaders: false,
    message: { message: "Too many requests. Please try again in a minute." }
  }), require("./api/routes/jobs")(objDatabase));
  objApp.get("/vendor/bootstrap.min.css", (objRequest, objResponse) =>
    objResponse.sendFile(require.resolve("bootstrap/dist/css/bootstrap.min.css")));
  objApp.use(objExpress.static(objPath.join(__dirname, "public"), { dotfiles: "deny" }));
  objApp.use((objRequest, objResponse) => objResponse.status(404).json({ message: "Page or endpoint not found." }));
  objApp.use((objError, objRequest, objResponse, fnNext) => {
    if (objResponse.headersSent) return fnNext(objError);
    if (objError.type === "entity.parse.failed") return objResponse.status(400).json({ message: "Invalid JSON." });
    if (objError.type === "entity.too.large") return objResponse.status(413).json({ message: "Request is too large." });
    console.error("Request failed:", objError.name);
    return objResponse.status(500).json({ message: "Unable to complete the request. Please try again." });
  });
  return objApp;
}
async function fnStart() {
  fnGetJwtConfig();
  const intPort = Number(process.env.PORT || 3000);
  if (!Number.isInteger(intPort) || intPort < 1 || intPort > 65535) throw new Error("Invalid PORT.");
  const objDatabase = require("./models");
  await objDatabase.objSequelize.authenticate();
  const objServer = fnCreateApp(objDatabase).listen(intPort, process.env.HOST || "127.0.0.1", () =>
    console.log("SwollenHippo listening on port " + intPort));
  const fnShutdown = () => {
    const objTimer = setTimeout(() => process.exit(1), 10000);
    objTimer.unref();
    objServer.close(async () => { await objDatabase.objSequelize.close(); clearTimeout(objTimer); });
  };
  process.once("SIGINT", fnShutdown);
  process.once("SIGTERM", fnShutdown);
}
if (require.main === module) fnStart().catch((objError) => { console.error("Startup failed:", objError.message); process.exitCode = 1; });
module.exports = { fnCreateApp };
