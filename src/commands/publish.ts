import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, basename } from 'path';
import { api } from '../lib/api.js';
import { isAuthenticated, getConfig } from '../lib/config.js';
import { verifySkill } from '../lib/installer.js';
import { success, error, info, warning } from '../lib/ui.js';

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  keywords?: string[];
  license?: string;
  repository?: string | { url?: string };
  homepage?: string;
}

export const publishCommand = new Command('publish')
  .description('Publish a skill to the registry')
  .argument('[path]', 'Path to skill directory', '.')
  .option('--dry-run', 'Validate without publishing')
  .action(async (path: string, options: { dryRun?: boolean }) => {
    const spinner = ora();
    const skillPath = resolve(path);

    // Check authentication
    if (!isAuthenticated()) {
      error('You must be logged in to publish');
      info(`Run: ${chalk.green('skill-get login')}`);
      process.exit(1);
    }

    try {
      spinner.start('Validating skill...');

      // Verify skill structure
      const validation = await verifySkill(skillPath);
      if (!validation.valid) {
        spinner.fail('Validation failed');
        for (const err of validation.errors) {
          error(err);
        }
        process.exit(1);
      }

      // Read SKILL.md
      const skillMdPath = join(skillPath, 'SKILL.md');
      const skillMd = await readFile(skillMdPath, 'utf-8');

      // Read package.json if exists
      let packageJson: PackageJson = {};
      const packageJsonPath = join(skillPath, 'package.json');
      if (existsSync(packageJsonPath)) {
        const content = await readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(content);
      }

      // Read README if exists
      let readme: string | undefined;
      const readmePath = join(skillPath, 'README.md');
      if (existsSync(readmePath)) {
        readme = await readFile(readmePath, 'utf-8');
      }

      // Extract name from SKILL.md or package.json
      const nameMatch = skillMd.match(/^#\s*(.+)$/m);
      const name = packageJson.name ||
        nameMatch?.[1]?.toLowerCase().replace(/\s+/g, '-') ||
        basename(skillPath);

      // Get version
      const version = packageJson.version || '1.0.0';

      // Get other metadata
      const description = packageJson.description ||
        skillMd.split('\n').find(line => line.trim() && !line.startsWith('#'))?.trim();

      const keywords = packageJson.keywords || [];

      // Extract category from SKILL.md if present
      const categoryMatch = skillMd.match(/Category:\s*(.+)/i);
      const category = categoryMatch?.[1]?.trim();

      // Parse repository URL
      let repository: string | undefined;
      if (typeof packageJson.repository === 'string') {
        repository = packageJson.repository;
      } else if (packageJson.repository?.url) {
        repository = packageJson.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
      }

      spinner.succeed('Validation passed');

      // Show what will be published
      console.log('\n' + chalk.bold('Package details:'));
      console.log(`  Name:        ${chalk.cyan(name)}`);
      console.log(`  Version:     ${chalk.green(version)}`);
      if (description) {
        console.log(`  Description: ${description.slice(0, 60)}${description.length > 60 ? '...' : ''}`);
      }
      if (keywords.length > 0) {
        console.log(`  Keywords:    ${keywords.join(', ')}`);
      }
      if (category) {
        console.log(`  Category:    ${category}`);
      }
      console.log(`  License:     ${packageJson.license || 'MIT'}`);

      if (options.dryRun) {
        info('Dry run - not publishing');
        return;
      }

      // Confirm publish
      const inquirer = await import('inquirer');
      const { confirm } = await inquirer.default.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Publish ${chalk.cyan(name)}@${chalk.green(version)}?`,
        default: true
      }]);

      if (!confirm) {
        warning('Publish cancelled');
        return;
      }

      spinner.start('Publishing...');

      // Publish to registry
      const response = await api.publishSkill({
        name,
        version,
        description,
        keywords,
        category,
        license: packageJson.license,
        repository,
        readme,
        skill_md: skillMd
      });

      if (response.error) {
        spinner.fail('Publish failed');
        error(response.message || 'Unknown error');
        process.exit(1);
      }

      spinner.succeed(`Published ${chalk.cyan(name)}@${chalk.green(version)}`);
      success('Your skill is now available on MCPSkills registry!');
      info(`View at: https://mcpskills.com/skills/${name}`);

    } catch (err) {
      spinner.fail('Publish failed');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });
