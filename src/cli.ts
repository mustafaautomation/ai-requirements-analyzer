#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import { parseRequirements } from './analyzers/requirement-parser';
import { TestCaseGenerator, MockLLMClient } from './generators/test-case-generator';

const R = '\x1b[0m',
  B = '\x1b[1m',
  D = '\x1b[2m';
const RED = '\x1b[31m',
  GRN = '\x1b[32m',
  YEL = '\x1b[33m',
  CYN = '\x1b[36m';

const program = new Command();
program.name('req-analyze').description('AI-powered requirements → test cases').version('1.0.0');

program
  .command('analyze')
  .description('Analyze requirements and generate test cases')
  .argument('<file>', 'Requirements file (JSON or Markdown)')
  .option('--json', 'Output as JSON')
  .option('--mock', 'Use mock LLM')
  .action(async (file: string, options) => {
    if (!fs.existsSync(file)) {
      console.error(`Not found: ${file}`);
      process.exit(1);
    }

    const content = fs.readFileSync(file, 'utf-8');
    const requirements = parseRequirements(content);
    console.log(`Parsed ${requirements.length} requirements from ${file}`);

    const generator = new TestCaseGenerator(new MockLLMClient());
    const report = await generator.generateFromRequirements(requirements);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log();
      console.log(`${B}${CYN}Requirements Analysis Report${R}`);
      console.log(`  Requirements: ${report.requirements.length}`);
      console.log(`  Test Cases:   ${report.totalTestCases}`);
      console.log(`  Coverage:     ${report.coverage.coveragePercentage}%`);
      console.log();
      console.log(`  ${B}By Type:${R}`);
      for (const [type, count] of Object.entries(report.coverage.testsByType)) {
        if (count > 0) console.log(`    ${type}: ${count}`);
      }
      console.log();

      for (const tc of report.testCases) {
        const icon =
          tc.type === 'negative' ? `${RED}!` : tc.type === 'edge-case' ? `${YEL}~` : `${GRN}+`;
        console.log(`  ${icon}${R} ${B}${tc.title}${R} ${D}[${tc.type}] (${tc.requirementId})${R}`);
        for (const step of tc.steps) {
          console.log(`    ${D}${step}${R}`);
        }
        console.log(`    ${D}→ ${tc.expectedResult}${R}`);
      }
      console.log();
    }
  });

program.parse();
