import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { installSkill, installFromLocal } from '../lib/installer.js';
import { getSkillsPath, getAgentName } from '../lib/paths.js';
import { getConfig } from '../lib/config.js';
import { success, error, info } from '../lib/ui.js';
import { existsSync } from 'fs';

export const installCommand = new Command('install')
  .description('Install a skill from the registry or local directory')
  .argument('<name>', 'Skill name or local path')
  .option('-v, --version <version>', 'Specific version to install', 'latest')
  .option('-f, --force', 'Force reinstall if already installed')
  .option('-l, --local', 'Install from local directory')
  .action(async (name: string, options: { version: string; force?: boolean; local?: boolean }) => {
    const config = getConfig();
    const spinner = ora();

    try {
      // Check if installing from local path
      if (options.local || existsSync(name)) {
        spinner.start(`Installing skill from ${chalk.cyan(name)}...`);

        const result = await installFromLocal(name);

        if (result.success) {
          spinner.succeed(`Installed ${chalk.cyan(result.name)} from local directory`);
          info(`Location: ${result.path}`);
        } else {
          spinner.fail(`Failed to install from ${name}`);
          error(result.error || 'Unknown error');
          process.exit(1);
        }

        return;
      }

      // Parse name@version format
      let skillName = name;
      let version = options.version;

      if (name.includes('@') && !name.startsWith('@')) {
        const parts = name.split('@');
        skillName = parts[0]!;
        version = parts[1] || 'latest';
      }

      spinner.start(`Installing ${chalk.cyan(skillName)}@${chalk.gray(version)}...`);

      const result = await installSkill(skillName, version, { force: options.force });

      if (result.success) {
        spinner.succeed(`Installed ${chalk.cyan(result.name)}@${chalk.green(result.version)}`);
        info(`Location: ${result.path}`);

        const agent = getAgentName(config.agent);
        success(`Ready to use with ${agent}!`);
      } else {
        spinner.fail(`Failed to install ${skillName}`);
        error(result.error || 'Unknown error');
        process.exit(1);
      }
    } catch (err) {
      spinner.fail('Installation failed');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });
