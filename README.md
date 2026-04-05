# AI Requirements Analyzer

[![CI](https://github.com/mustafaautomation/ai-requirements-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/ai-requirements-analyzer/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

AI-powered tool that reads PRDs, user stories, and requirements documents, then generates structured test cases with coverage analysis. Pluggable LLM backend (Claude, OpenAI, or custom).

---

## Pipeline

```
Requirements (JSON/Markdown) → Parse → LLM Test Generation → Coverage Analysis → Report
```

---

## Quick Start

```bash
# Analyze requirements and generate test cases
npx req-analyze analyze requirements.json --mock

# JSON output for CI
npx req-analyze analyze requirements.json --json
```

---

## Input Formats

### JSON
```json
[
  {
    "id": "REQ-001",
    "title": "User Registration",
    "description": "Users can create an account",
    "acceptanceCriteria": ["Email validated", "Password strength check"],
    "priority": "critical"
  }
]
```

### Markdown
```markdown
## User Registration
Users can create an account
- Email validated
- Password strength check
```

---

## Generated Output

For each requirement, generates:
- **Functional** test cases (happy path)
- **Edge-case** tests (boundaries, empty inputs)
- **Negative** tests (unauthorized, invalid data)

Plus coverage analysis: which requirements have tests, which don't.

---

## Library API

```typescript
import { parseRequirements, TestCaseGenerator, MockLLMClient } from 'ai-requirements-analyzer';

const requirements = parseRequirements(fs.readFileSync('reqs.json', 'utf-8'));
const generator = new TestCaseGenerator(new MockLLMClient());
const report = await generator.generateFromRequirements(requirements);

console.log(`Coverage: ${report.coverage.coveragePercentage}%`);
console.log(`Test cases: ${report.totalTestCases}`);
```

---

## Project Structure

```
ai-requirements-analyzer/
├── src/
│   ├── core/types.ts                    # Requirement, TestCase, Coverage types
│   ├── analyzers/requirement-parser.ts  # JSON + Markdown parser
│   ├── generators/test-case-generator.ts # LLM-powered test generation
│   ├── cli.ts
│   └── index.ts
├── tests/unit/
│   ├── parser.test.ts                   # 6 tests
│   └── generator.test.ts               # 5 tests
├── examples/
│   └── requirements.json
└── .github/workflows/ci.yml
```

---

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
