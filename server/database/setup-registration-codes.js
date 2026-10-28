const fs = require("node:fs");
const path = require("node:path");
const db = require("./postgres");
db.query(fs.readFileSync(path.join(__dirname, "migrations/registration-codes.sql"), "utf8"))
  .then(() => console.log("Registration-code storage ready. No accounts were created or changed."))
  .catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => db.end());
