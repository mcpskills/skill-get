import Conf from 'conf';
import { getSkillsPath, detectAgent, getConfigPath } from './paths.js';
import type { Config, InstalledSkill } from '../types.js';

const DEFAULT_API_URL = 'https://api.mcpskills.dev';

interface StoreSchema {
  token?: string;
  username?: string;
  apiUrl: string;
  agent: string;
  skillsPath: string;
  installedSkills: Record<string, InstalledSkill>;
}

const config = new Conf<StoreSchema>({
  projectName: 'skill-get',
  defaults: {
    apiUrl: DEFAULT_API_URL,
    agent: detectAgent(),
    skillsPath: getSkillsPath(),
    installedSkills: {}
  }
});

export function getConfig(): Config {
  return {
    token: config.get('token'),
    username: config.get('username'),
    apiUrl: config.get('apiUrl'),
    skillsPath: config.get('skillsPath'),
    agent: config.get('agent')
  };
}

export function setToken(token: string, username: string): void {
  config.set('token', token);
  config.set('username', username);
}

export function clearToken(): void {
  config.delete('token');
  config.delete('username');
}

export function setApiUrl(url: string): void {
  config.set('apiUrl', url);
}

export function setAgent(agent: string): void {
  config.set('agent', agent);
  config.set('skillsPath', getSkillsPath(agent));
}

export function getInstalledSkills(): Record<string, InstalledSkill> {
  return config.get('installedSkills');
}

export function addInstalledSkill(skill: InstalledSkill): void {
  const skills = getInstalledSkills();
  skills[skill.name] = skill;
  config.set('installedSkills', skills);
}

export function removeInstalledSkill(name: string): void {
  const skills = getInstalledSkills();
  delete skills[name];
  config.set('installedSkills', skills);
}

export function getInstalledSkill(name: string): InstalledSkill | undefined {
  const skills = getInstalledSkills();
  return skills[name];
}

export function isAuthenticated(): boolean {
  return !!config.get('token');
}

export { config };
