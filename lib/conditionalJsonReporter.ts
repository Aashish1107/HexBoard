import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import fs from 'node:fs/promises';
import path from 'node:path';

class ConditionalJsonReporter implements Reporter {
  private results: { title: string; status: string }[] = [];
  private hasFailures = false;
  private outputFile: string;

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile = options.outputFile ?? 'results.json';
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== 'passed' && result.status !== 'skipped') {
      this.hasFailures = true;
    }
    this.results.push({ title: test.titlePath().join(' > '), status: result.status });
  }

  async onEnd(result: FullResult) {
    if (!this.hasFailures) return;
    await fs.mkdir(path.dirname(this.outputFile), { recursive: true });
    await fs.writeFile(
      this.outputFile,
      JSON.stringify({ status: result.status, tests: this.results }, null, 2)
    );
  }
}

export default ConditionalJsonReporter;
