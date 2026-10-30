import type {
  Reporter,
  TestCase,
  TestResult,
  TestError,
  FullResult,
} from "@playwright/test/reporter";

export function redact(text: string) {
  return text
    .replace(/([?&#](?:code|token|token_hash)=)[^\s&"'<>]+/gi, "$1[redacted]")
    .replace(/sb_(?:secret|publishable)_[a-z0-9_-]+/gi, "[key redacted]")
    .replace(/eyJ[a-z0-9_-]+\.[a-z0-9_-]+\.[a-z0-9_-]+/gi, "[JWT redacted]");
}

export default class CiReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`${result.status}: ${test.title} (${result.duration}ms)`);
    for (const error of result.errors)
      console.error(redact(error.message || "Browser test failed."));
  }
  onError(error: TestError) {
    console.error(redact(error.message || "Browser suite failed."));
  }
  onEnd(result: FullResult) {
    console.log(`Browser suite: ${result.status}.`);
  }
}
