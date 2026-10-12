"use strict";
const objFs = require("node:fs");
const objPath = require("node:path");
const objChild = require("node:child_process");
const strRoot = objPath.resolve(__dirname, "..");
let intFiles = 0;
function fnCheck(strDirectory) {
  for (const objEntry of objFs.readdirSync(strDirectory, { withFileTypes: true })) {
    if (["node_modules", ".git", "test-results"].includes(objEntry.name)) continue;
    const strFile = objPath.join(strDirectory, objEntry.name);
    if (objEntry.isDirectory()) { fnCheck(strFile); continue; }
    if (/\.(cs|csproj|sln)$/.test(strFile)) throw new Error("Legacy .NET file: " + strFile);
    if (/\.(js|html|css|json|md|example)$/.test(strFile)) {
      const strText = objFs.readFileSync(strFile, "utf8");
      if (/^(?:<{7}|={7}|>{7})(?: |$)/m.test(strText)) throw new Error("Unresolved merge conflict: " + strFile);
    }
    if (strFile.endsWith(".js")) { objChild.execFileSync(process.execPath, ["--check", strFile]); intFiles++; }
  }
}
fnCheck(strRoot); console.log(intFiles + " JavaScript files passed syntax checks; no legacy .NET files or conflict markers found.");
