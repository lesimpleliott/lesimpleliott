import readline from "readline";

export const askYesNo = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${question} `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "o");
    });
  });
