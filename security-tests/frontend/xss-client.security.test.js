// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import fs from "fs";
import path from "path";

const collectJavaScriptFiles = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const discoveredFiles = [];

  for (const entry of entries) {
    if (entry.name === "_site") {
      continue;
    }

    const resolvedPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      discoveredFiles.push(...collectJavaScriptFiles(resolvedPath));
      continue;
    }

    if (entry.isFile() && resolvedPath.endsWith(".js")) {
      discoveredFiles.push(resolvedPath);
    }
  }

  return discoveredFiles;
};

describe("Client-side source review security tests", () => {
  test("frontend code avoids dangerous DOM injection and runtime code execution sinks", () => {
    // arrange
    const clientSourceRoot = path.resolve(process.cwd(), "client/src");
    const javascriptFiles = collectJavaScriptFiles(clientSourceRoot);
    const dangerousPatterns = [
      /dangerouslySetInnerHTML/,
      /\beval\s*\(/,
      /\bnew Function\s*\(/,
    ];

    // act
    const filesWithDangerousSinks = javascriptFiles.filter((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      return dangerousPatterns.some((pattern) => pattern.test(source));
    });

    // assert
    expect(filesWithDangerousSinks).toEqual([]);
  });
});
