import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

// Skill installation paths by agent/tool
const SKILL_PATHS: Record<string, string> = {
  'claude-code': '.claude/skills',
  'claude-desktop': '.claude/skills',
  'codex': '.codex/skills',
  'cursor': '.cursor/skills',
  'windsurf': '.windsurf/skills',
  'continue': '.continue/skills',
  'aider': '.aider/skills',
  'default': '.ai-skills'
};

export function detectAgent(): string {
  // Check environment variables
  if (process.env.CLAUDE_CODE) return 'claude-code';
  if (process.env.CURSOR_SESSION) return 'cursor';
  if (process.env.WINDSURF_SESSION) return 'windsurf';
  if (process.env.CODEX_SESSION) return 'codex';

  // Check for existing directories
  const home = homedir();

  // Prioritize Claude paths
  if (existsSync(join(home, '.claude'))) return 'claude-code';
  if (existsSync(join(home, '.cursor'))) return 'cursor';
  if (existsSync(join(home, '.windsurf'))) return 'windsurf';
  if (existsSync(join(home, '.codex'))) return 'codex';
  if (existsSync(join(home, '.continue'))) return 'continue';
  if (existsSync(join(home, '.aider'))) return 'aider';

  return 'default';
}

export function getSkillsPath(agent?: string): string {
  const detectedAgent = agent || detectAgent();
  const relativePath = SKILL_PATHS[detectedAgent] || SKILL_PATHS['default'];
  return join(homedir(), relativePath!);
}

export function getSkillPath(skillName: string, agent?: string): string {
  return join(getSkillsPath(agent), skillName);
}

export function getConfigPath(): string {
  return join(homedir(), '.skillgetrc');
}

export function getCachePath(): string {
  return join(homedir(), '.cache', 'skill-get');
}

export function getTempPath(): string {
  return join(homedir(), '.cache', 'skill-get', 'tmp');
}

export function getAgentName(agent: string): string {
  const names: Record<string, string> = {
    'claude-code': 'Claude Code',
    'claude-desktop': 'Claude Desktop',
    'codex': 'Codex',
    'cursor': 'Cursor',
    'windsurf': 'Windsurf',
    'continue': 'Continue',
    'aider': 'Aider',
    'default': 'Default'
  };
  return names[agent] || agent;
}
