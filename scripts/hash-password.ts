#!/usr/bin/env tsx
// Generates ADMIN_PASSWORD_HASH (scrypt).
//
//   npm run hash-password            → prompts for the password (hidden input)
//   npm run hash-password -- "pass"  → hashes the argument (ends up in shell history!)
import readline from "node:readline";
import { hashPassword } from "../src/lib/password";

const MIN_LENGTH = 10;

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const internal = rl as unknown as { output: NodeJS.WriteStream; _writeToOutput: (s: string) => void };
    let muted = false;
    internal._writeToOutput = (str: string) => {
      if (!muted) internal.output.write(str);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
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
  console.log("\nADMIN_PASSWORD_HASH (paste as-is into Vercel or .env):\n");
  console.log(await hashPassword(password));
}

main();
