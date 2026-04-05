export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TestType =
  | 'functional'
  | 'edge-case'
  | 'negative'
  | 'performance'
  | 'security'
  | 'accessibility';

export interface Requirement {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: Priority;
}

export interface GeneratedTestCase {
  id: string;
  requirementId: string;
  title: string;
  type: TestType;
  priority: Priority;
  preconditions: string[];
  steps: string[];
  expectedResult: string;
  tags: string[];
}

export interface CoverageAnalysis {
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercentage: number;
  uncoveredRequirements: string[];
  testsByType: Record<TestType, number>;
  testsByPriority: Record<Priority, number>;
}

export interface AnalysisReport {
  timestamp: string;
  requirements: Requirement[];
  testCases: GeneratedTestCase[];
  coverage: CoverageAnalysis;
  totalTestCases: number;
}
