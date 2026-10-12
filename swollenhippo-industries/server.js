"use strict";
const express = require("express");
const helmet = require("helmet");
const path = require("node:path");
const objDatabase = require("./models");
const { getJwtConfig } = require("./api/config");
const objAuthRouter = require("./api/routes/auth");
const objJobsRouter = require("./api/routes/jobs");
const app = express();
const port = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === "production";
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
app.disable("x-powered-by");
// External local scripts and styles work with a restrictive CSP.
app.use(helmet({
  strictTransportSecurity: production ? undefined : false,
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'"], imgSrc: ["'self'"], fontSrc: ["'self'"],
    connectSrc: ["'self'"], objectSrc: ["'none'"], baseUri: ["'none'"],
    formAction: ["'self'"], frameAncestors: ["'none'"],
    upgradeInsecureRequests: production ? [] : null
  } }
}));
app.use(express.json({ limit: "16kb" }));
app.use("/api/auth", objAuthRouter);
app.use("/api/jobs", objJobsRouter);
app.use(express.static(path.join(__dirname, "public"), { dotfiles: "deny" }));
app.use((req, res) => res.status(404).type("text/plain").send("Page not found. Return to /."));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).type("text/plain").send("An unexpected error occurred.");
});
async function start() {
  getJwtConfig();
  await objDatabase.objSequelize.authenticate();
  app.listen(port, "127.0.0.1", () => console.log(`SwollenHippo Industries: http://127.0.0.1:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to connect to MariaDB or start the server:", error);
    process.exitCode = 1;
  });
}

module.exports = app;