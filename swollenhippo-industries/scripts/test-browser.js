"use strict";
const { expect: fnExpect } = require("@playwright/test");

const objAssert = require("node:assert/strict");
const objFs = require("node:fs");
const objPath = require("node:path");
const {
  chromium: objChromium,
  firefox: objFirefox,
  webkit: objWebkit
} = require("@playwright/test");
const { default: clsAxeBuilder } = require("@axe-core/playwright");
const { fnCreateApp } = require("../server");
const {
  fnTestEnvironment,
  fnTestDatabase
} = require("../api/tests/fixtures");

// Select one browser per run to limit memory usage on the VM.
const strBrowserName = process.env.TEST_BROWSER || "chromium";

const objBrowserTargets = {
  chromium: {
    objType: objChromium,
    objOptions: {}
  },
  firefox: {
    objType: objFirefox,
    objOptions: {}
  },
  webkit: {
    objType: objWebkit,
    objOptions: {}
  },
  chrome: {
    objType: objChromium,
    objOptions: { channel: "chrome" }
  },
  edge: {
    objType: objChromium,
    objOptions: { channel: "msedge" }
  }
};

async function fnRun() {
  if (!Object.hasOwn(objBrowserTargets, strBrowserName)) {
    throw new Error("Unsupported TEST_BROWSER: " + strBrowserName);
  }

  const objBrowserTarget = objBrowserTargets[strBrowserName];

  // Use isolated test accounts and jobs, not the production database.
  fnTestEnvironment();
  const objDatabase = fnTestDatabase();
  const objServer = fnCreateApp(objDatabase).listen(0, "127.0.0.1");

  await new Promise((fnResolve, fnReject) => {
    objServer.once("listening", fnResolve);
    objServer.once("error", fnReject);
  });

  let objBrowser;

  try {
    console.log("Testing browser: " + strBrowserName);

    objBrowser = await objBrowserTarget.objType.launch({
      headless: true,
      ...objBrowserTarget.objOptions
    });

    const objContext = await objBrowser.newContext({
      viewport: { width: 1280, height: 900 }
    });
    const objPage = await objContext.newPage();
    const arrErrors = [];

    objPage.on("pageerror", (objError) => {
      arrErrors.push(objError.message);
    });

    const strBase = "http://127.0.0.1:" + objServer.address().port;
    const strResults = objPath.resolve(
      __dirname,
      "../test-results",
      strBrowserName
    );

    objFs.mkdirSync(strResults, { recursive: true });

    const fnAudit = async (strName) => {
      const objReport = await new clsAxeBuilder({ page: objPage })
        .withTags([
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22aa"
        ])
        .analyze();

      objAssert.deepEqual(
        objReport.violations.map((objViolation) => ({
          id: objViolation.id,
          nodes: objViolation.nodes.map((objNode) => objNode.target)
        })),
        [],
        strName + " accessibility violations"
      );

      console.log("Accessibility passed: " + strName);
    };

    // Verify keyboard access through the skip link.
    await objPage.goto(strBase);
    await objPage.keyboard.press("Tab");

    objAssert.equal(
      await objPage.locator(":focus").textContent(),
      "Skip to main content"
    );

    await objPage.keyboard.press("Enter");

    objAssert.equal(
      await objPage.locator(":focus").getAttribute("id"),
      "main-content"
    );

    await fnAudit("home");

    objAssert.ok(
      await objPage.locator(".brand img").evaluate(
        (objImage) => objImage.getBoundingClientRect().width >= 180
      ),
      "Desktop logo must be prominent"
    );

    await objPage.evaluate(() => {
      document.activeElement.blur();
      window.scrollTo({ top: 0, behavior: "instant" });
    });

    await objPage.screenshot({
      path: objPath.join(strResults, "home-desktop.png"),
      fullPage: false
    });

    // Check validation and preserve the inquiry through account creation.
    await objPage.getByRole("button", { name: "Send inquiry" }).click();

    objAssert.equal(
      await objPage.locator(":focus").getAttribute("id"),
      "error-summary"
    );

    await fnAudit("inquiry validation errors");

    await objPage.getByLabel("Full name (required)")
      .fill("Browser Customer");
    await objPage.getByLabel("Work email (required)")
      .fill("browser@example.com");
    await objPage.getByLabel("Primary service needed (required)")
      .selectOption("design");
    await objPage.getByLabel("Project details (required)")
      .fill("<img src=x onerror=alert(1)> A keyboard-accessible prototype.");

    await objPage.getByRole("link", {
      name: "Sign in or create an account",
      exact: true
    }).click();

    await fnAudit("account");

    await objPage.getByLabel("Username", { exact: true })
      .fill("browser-new-customer");
    await objPage.getByLabel("Password", { exact: true })
      .fill("browser-long-password");
    await objPage.getByRole("button", {
      name: "Create customer account"
    }).click();

    await objPage.getByText(
      "Account created. Please sign in.",
      { exact: true }
    ).waitFor();

    await objPage.getByLabel("Password", { exact: true })
      .fill("browser-long-password");
    await objPage.getByRole("button", {
      name: "Sign in",
      exact: true
    }).click();

    await objPage.getByRole("button", { name: "Sign out" }).waitFor();
    await objPage.getByRole("link", { name: "Submit an inquiry" }).click();

    await fnExpect(
      objPage.getByLabel("Full name (required)")
    ).toHaveValue("Browser Customer", { timeout: 10000 });

    await objPage.getByRole("button", { name: "Send inquiry" }).click();
    await objPage.getByText(/Inquiry #1 was saved/).waitFor();

    await objPage.getByRole("link", {
      name: "Account and job dashboard"
    }).click();

    await objPage.getByRole("heading", {
      name: "Job #1 · Browser Customer"
    }).waitFor();

    // Submitted HTML must display as text, not become an image element.
    objAssert.equal(
      await objPage.locator(".job-details img").count(),
      0
    );

    await fnAudit("customer dashboard");

    // Check dashboard search, filtering, and sorting.
    await objPage.getByLabel("Search jobs on this page", { exact: true })
      .fill("nonexistent project");

    await objPage.getByText(
      "No jobs match these filters. Clear the search or choose another status.",
      { exact: true }
    ).waitFor();

    await objPage.getByLabel("Search jobs on this page", { exact: true })
      .fill("");
    await objPage.getByLabel("Status", { exact: true })
      .selectOption("InProgress");

    objAssert.equal(
      await objPage.locator("#job-list article").count(),
      0
    );

    await objPage.getByLabel("Status", { exact: true })
      .selectOption("all");
    await objPage.getByLabel("Sort jobs", { exact: true })
      .selectOption("completion");

    objAssert.equal(
      await objPage.locator("#job-list article").count(),
      1
    );

    // These administrator credentials exist only in the test fixture.
    await objPage.getByRole("button", { name: "Sign out" }).click();
    await objPage.getByLabel("Username", { exact: true })
      .fill("administrator");
    await objPage.getByLabel("Password", { exact: true })
      .fill("administrator-password");
    await objPage.getByRole("button", {
      name: "Sign in",
      exact: true
    }).click();

    await objPage.getByLabel("Status for job #1", { exact: true })
      .selectOption("InProgress");
    await objPage.getByLabel("Expected completion for job #1 (optional)")
      .fill("2026-10-20");
    await objPage.getByRole("button", { name: "Save job #1" }).click();

    await objPage.getByText("Job updated.", { exact: true }).waitFor();

    objAssert.equal(objDatabase.arrJobs[0].strStatus, "InProgress");

    // Open and submit the inquiry editor using the keyboard.
    await objPage.locator("summary").focus();
    await objPage.keyboard.press("Enter");
    await fnAudit("expanded inquiry editor");

    await objPage.getByLabel("Project details for inquiry #1", {
      exact: true
    }).fill("Updated enclosure dimensions for manufacturing.");

    await objPage.getByRole("button", {
      name: "Save inquiry #1"
    }).focus();
    await objPage.keyboard.press("Enter");

    await objPage.getByText(
      "Inquiry #1 updated.",
      { exact: true }
    ).waitFor();

    objAssert.equal(
      await objPage.locator(":focus").getAttribute("id"),
      "jobs-status"
    );
    objAssert.equal(
      objDatabase.arrJobs[0].strDetails,
      "Updated enclosure dimensions for manufacturing."
    );

    await fnAudit("administrator dashboard");

    await objPage.screenshot({
      path: objPath.join(strResults, "dashboard-desktop.png"),
      fullPage: true
    });

    // Check layout at a narrow viewport.
    await objPage.setViewportSize({ width: 320, height: 900 });
    await fnAudit("mobile dashboard");

    objAssert.ok(
      await objPage.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      ),
      "Dashboard horizontal overflow"
    );

    await objPage.screenshot({
      path: objPath.join(strResults, "dashboard-mobile.png"),
      fullPage: true
    });

    // Cancelling deletion must preserve the job.
    objPage.once("dialog", (objDialog) => objDialog.dismiss());

    await objPage.getByRole("button", {
      name: "Delete job #1"
    }).focus();
    await objPage.keyboard.press("Enter");

    objAssert.equal(
      objDatabase.arrJobs.length,
      1,
      "Cancelling must preserve the job"
    );

    // Confirmed deletion must remove the job and restore status focus.
    objPage.once("dialog", (objDialog) => objDialog.accept());

    await objPage.getByRole("button", {
      name: "Delete job #1"
    }).focus();
    await objPage.keyboard.press("Enter");

    await objPage.getByText(
      "Job #1 deleted.",
      { exact: true }
    ).waitFor();

    objAssert.equal(objDatabase.arrJobs.length, 0);
    objAssert.equal(
      await objPage.locator(":focus").getAttribute("id"),
      "jobs-status"
    );

    await fnAudit("empty dashboard after deletion");

    await objPage.goto(strBase);
    await fnAudit("mobile home");

    objAssert.ok(
      await objPage.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      ),
      "Home horizontal overflow"
    );

    await objPage.screenshot({
      path: objPath.join(strResults, "home-mobile.png"),
      fullPage: true
    });

    objAssert.deepEqual(arrErrors, [], "Unexpected browser JavaScript errors");

    console.log(
      "Browser workflow, keyboard skip link, mobile reflow, " +
      "and automated accessibility checks passed."
    );
    console.log("PASS: " + strBrowserName);
    console.log("Screenshots: " + strResults);
  } finally {
    // Close the temporary server even if browser cleanup fails.
    try {
      if (objBrowser) {
        await objBrowser.close();
      }
    } finally {
      await new Promise((fnResolve, fnReject) => {
        objServer.close((objError) => {
          if (objError) {
            fnReject(objError);
          } else {
            fnResolve();
          }
        });
      });
    }
  }
}

fnRun().catch((objError) => {
  console.error("FAIL: " + strBrowserName);
  console.error(objError);
  process.exitCode = 1;
});
