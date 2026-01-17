import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { updateSkill } from '../lib/installer.js';
import { getInstalledSkills, getInstalledSkill } from '../lib/config.js';
import { success, error, info, warning } from '../lib/ui.js';

export const updateCommand = new Command('update')
  .alias('upgrade')
  .description('Update installed skill(s) to latest version')
  .argument('[name]', 'Skill name to update (updates all if not specified)')
  .option('--check', 'Only check for updates, do not install')
  .action(async (name: string | undefined, options: { check?: boolean }) => {
    const spinner = ora();

    try {
      if (name) {
        // Update single skill
        const installed = getInstalledSkill(name);
        if (!installed) {
          error(`Skill '${name}' is not installed`);
          process.exit(1);
        }

        spinner.start(`Checking for updates to ${chalk.cyan(name)}...`);

        const result = await updateSkill(name);

        if (result.success) {
          if (result.error === 'Already at latest version') {
            spinner.info(`${chalk.cyan(name)} is already at the latest version (${result.version})`);
          } else {
            spinner.succeed(`Updated ${chalk.cyan(name)} to ${chalk.green(result.version)}`);
          }
        } else {
          spinner.fail(`Failed to update ${name}`);
          error(result.error || 'Unknown error');
          process.exit(1);
        }
      } else {
        // Update all skills
        const skills = getInstalledSkills();
        const skillList = Object.values(skills);

        if (skillList.length === 0) {
          warning('No skills installed');
          return;
        }

        spinner.start('Checking for updates...');

        let updatedCount = 0;
        let errorCount = 0;

        for (const skill of skillList) {
          spinner.text = `Checking ${chalk.cyan(skill.name)}...`;

          const result = await updateSkill(skill.name);

          if (result.success) {
            if (result.error !== 'Already at latest version') {
              updatedCount++;
              success(`Updated ${chalk.cyan(skill.name)} to ${chalk.green(result.version)}`);
            }
          } else {
            errorCount++;
            warning(`Failed to update ${skill.name}: ${result.error}`);
          }
        }

        spinner.stop();

        if (updatedCount === 0 && errorCount === 0) {
          info('All skills are up to date!');
        } else {
          if (updatedCount > 0) {
            success(`Updated ${updatedCount} skill(s)`);
          }
          if (errorCount > 0) {
            warning(`Failed to update ${errorCount} skill(s)`);
          }
        }
      }
    } catch (err) {
      spinner.fail('Update failed');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });
