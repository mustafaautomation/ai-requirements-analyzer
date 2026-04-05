import { Requirement, Priority } from '../core/types';

/**
 * Parse requirements from various formats into structured Requirement objects.
 */
export function parseRequirements(content: string): Requirement[] {
  // Try JSON array first
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.map((r, i) => normalizeRequirement(r, i));
    }
    if (parsed.requirements && Array.isArray(parsed.requirements)) {
      return parsed.requirements.map((r: Record<string, unknown>, i: number) =>
        normalizeRequirement(r, i),
      );
    }
  } catch {
    // Not JSON — try markdown
  }

  // Parse markdown format (## headings with bullet points)
  return parseMarkdownRequirements(content);
}

function normalizeRequirement(raw: Record<string, unknown>, index: number): Requirement {
  return {
    id: String(raw.id || `REQ-${String(index + 1).padStart(3, '0')}`),
    title: String(raw.title || raw.name || `Requirement ${index + 1}`),
    description: String(raw.description || raw.body || ''),
    acceptanceCriteria: Array.isArray(raw.acceptanceCriteria)
      ? raw.acceptanceCriteria.map(String)
      : Array.isArray(raw.criteria)
        ? (raw.criteria as string[]).map(String)
        : [],
    priority: normalizePriority(String(raw.priority || 'medium')),
  };
}

function normalizePriority(raw: string): Priority {
  const lower = raw.toLowerCase();
  if (lower === 'critical' || lower === 'p0') return 'critical';
  if (lower === 'high' || lower === 'p1') return 'high';
  if (lower === 'low' || lower === 'p3') return 'low';
  return 'medium';
}

function parseMarkdownRequirements(content: string): Requirement[] {
  const requirements: Requirement[] = [];
  const sections = content.split(/^##\s+/m).filter(Boolean);

  for (let i = 0; i < sections.length; i++) {
    const lines = sections[i].split('\n');
    const title = lines[0].trim();
    const bullets = lines.filter((l) => l.trim().startsWith('- ')).map((l) => l.trim().slice(2));
    const bodyLines = lines
      .slice(1)
      .filter((l) => !l.trim().startsWith('- ') && l.trim())
      .join(' ')
      .trim();

    requirements.push({
      id: `REQ-${String(i + 1).padStart(3, '0')}`,
      title,
      description: bodyLines,
      acceptanceCriteria: bullets,
      priority: 'medium',
    });
  }

  return requirements;
}
