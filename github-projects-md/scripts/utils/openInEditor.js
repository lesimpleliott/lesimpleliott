import { exec } from "child_process";

export const openInEditor = (filepath) => {
  exec(`code "${filepath}"`);
};
