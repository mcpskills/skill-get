import chalk from 'chalk';
import type { PackageResponse, InstalledSkill } from '../types.js';

export function formatSkill(skill: PackageResponse, index?: number): string {
  const lines: string[] = [];

  const prefix = index !== undefined ? `${chalk.gray(`${index + 1}.`)} ` : '';
  const name = chalk.bold.cyan(skill.name);
  const version = skill.latest_version ? chalk.gray(`@${skill.latest_version}`) : '';
  const verified = skill.verified ? chalk.green(' ✓') : '';
  const featured = skill.featured ? chalk.yellow(' ★') : '';

  lines.push(`${prefix}${name}${version}${verified}${featured}`);

  if (skill.description) {
    const desc = skill.description.length > 80
      ? skill.description.slice(0, 77) + '...'
      : skill.description;
    lines.push(chalk.gray(`   ${desc}`));
  }

  const meta: string[] = [];
  if (skill.author) {
    meta.push(`by ${chalk.blue(skill.author.username)}`);
  }
  if (skill.downloads > 0) {
    meta.push(`${formatNumber(skill.downloads)} downloads`);
  }
  if (skill.rating) {
    meta.push(`${skill.rating.toFixed(1)}★`);
  }

  if (meta.length > 0) {
    lines.push(chalk.gray(`   ${meta.join(' • ')}`));
  }

  return lines.join('\n');
}

export function formatSkillList(skills: PackageResponse[]): string {
  if (skills.length === 0) {
    return chalk.yellow('No skills found.');
  }

  return skills.map((skill, i) => formatSkill(skill, i)).join('\n\n');
}

export function formatInstalledSkill(skill: InstalledSkill): string {
  const name = chalk.bold.cyan(skill.name);
  const version = chalk.gray(`@${skill.version}`);
  const path = chalk.gray(skill.path);

  return `${name}${version}\n   ${path}`;
}

export function formatInstalledSkillList(skills: InstalledSkill[]): string {
  if (skills.length === 0) {
    return chalk.yellow('No skills installed.');
  }

  return skills.map(formatInstalledSkill).join('\n\n');
}

export function formatSkillDetail(skill: PackageResponse): string {
  const lines: string[] = [];

  // Header
  const verified = skill.verified ? chalk.green(' ✓ Verified') : '';
  const featured = skill.featured ? chalk.yellow(' ★ Featured') : '';
  lines.push(chalk.bold.cyan(skill.name) + chalk.gray(`@${skill.latest_version || 'unknown'}`) + verified + featured);
  lines.push('');

  // Description
  if (skill.description) {
    lines.push(skill.description);
    lines.push('');
  }

  // Metadata table
  lines.push(chalk.bold('Details:'));
  if (skill.author) {
    lines.push(`  Author:     ${chalk.blue(skill.author.username)} (${skill.author.trust_tier})`);
  }
  lines.push(`  License:    ${skill.license}`);
  lines.push(`  Downloads:  ${formatNumber(skill.downloads)}`);
  if (skill.rating) {
    lines.push(`  Rating:     ${skill.rating.toFixed(1)} ★ (${skill.rating_count} ratings)`);
  }
  if (skill.category) {
    lines.push(`  Category:   ${skill.category}`);
  }
  if (skill.repository) {
    lines.push(`  Repository: ${chalk.underline(skill.repository)}`);
  }
  if (skill.homepage) {
    lines.push(`  Homepage:   ${chalk.underline(skill.homepage)}`);
  }

  // Keywords
  if (skill.keywords && skill.keywords.length > 0) {
    lines.push('');
    lines.push(chalk.bold('Keywords:'));
    lines.push(`  ${skill.keywords.map(k => chalk.gray(k)).join(', ')}`);
  }

  // Install command
  lines.push('');
  lines.push(chalk.bold('Install:'));
  lines.push(`  ${chalk.green('skill-get install ' + skill.name)}`);

  return lines.join('\n');
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function success(message: string): void {
  console.log(chalk.green('✓') + ' ' + message);
}

export function error(message: string): void {
  console.error(chalk.red('✗') + ' ' + message);
}

export function warning(message: string): void {
  console.log(chalk.yellow('⚠') + ' ' + message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ') + ' ' + message);
}

export function heading(text: string): void {
  console.log('\n' + chalk.bold(text) + '\n');
}

export function table(data: Array<Record<string, string | number>>, columns: string[]): void {
  // Calculate column widths
  const widths = columns.map(col => {
    const values = data.map(row => String(row[col] ?? '').length);
    return Math.max(col.length, ...values);
  });

  // Header
  const header = columns.map((col, i) => col.padEnd(widths[i]!)).join('  ');
  console.log(chalk.bold(header));
  console.log(chalk.gray('-'.repeat(header.length)));

  // Rows
  for (const row of data) {
    const line = columns.map((col, i) => String(row[col] ?? '').padEnd(widths[i]!)).join('  ');
    console.log(line);
  }
}
