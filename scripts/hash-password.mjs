#!/usr/bin/env node
// Generates a bcrypt hash for ADMIN_PASSWORD_HASH.
//
//   npm run hash-password            → prompts for the password (hidden input)
//   npm run hash-password -- "pass"  → hashes the argument (ends up in shell history!)

import bcrypt from "bcryptjs";
import readline from "node:readline";

const COST = 12;
const MIN_LENGTH = 10;

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Mute echo after the question is printed.
    rl._writeToOutput = function (str) {
      if (rl.stdoutMuted) rl.output.write(str.includes("\n") ? "\n" : "");
      else rl.output.write(str);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    rl.stdoutMuted = true;
  });
}

async function main() {
  let password = process.argv[2];
  if (!password) {
    password = await promptHidden("Admin password: ");
    const again = await promptHidden("Repeat password: ");
    if (password !== again) {
      console.error("Passwords do not match.");
      process.exit(1);
    }
  }
  if (!password || password.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, COST);
  console.log("\nVercel dashboard / any env UI (paste as-is):");
  console.log(`  ${hash}`);
  console.log("\nLocal .env file ($ escaped so Next.js doesn't expand it):");
  console.log(`  ADMIN_PASSWORD_HASH=${hash.replace(/\$/g, "\\$")}`);
}

main();
