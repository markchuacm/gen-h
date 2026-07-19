import { hashPassword } from "better-auth/crypto";

async function readHidden(prompt: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) {
    throw new Error("Run this command in an interactive terminal so the password can be entered without echoing.");
  }

  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    const onData = (character: string) => {
      if (character === "\u0003") {
        cleanup();
        reject(new Error("Cancelled"));
        return;
      }
      if (character === "\r" || character === "\n") {
        cleanup();
        process.stdout.write("\n");
        resolve(value);
        return;
      }
      if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
        return;
      }
      if (character >= " ") value += character;
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  const password = await readHidden("Developer mode password: ");
  if (password.length < 16) throw new Error("Use at least 16 characters.");
  const confirmation = await readHidden("Confirm password: ");
  if (password !== confirmation) throw new Error("Passwords do not match.");

  const hash = await hashPassword(password);
  process.stdout.write("\nAdd this line to the API environment (the plaintext password is never stored):\n\n");
  process.stdout.write(`DEVELOPER_MODE_PASSWORD_HASH=${hash}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
