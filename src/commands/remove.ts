import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { removeSkill } from '../lib/installer.js';
import { getInstalledSkill } from '../lib/config.js';
import { success, error, warning } from '../lib/ui.js';

export const removeCommand = new Command('remove')
  .alias('uninstall')
  .alias('rm')
  .description('Remove an installed skill')
  .argument('<name>', 'Skill name to remove')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (name: string, options: { yes?: boolean }) => {
    const spinner = ora();

    try {
      // Check if skill is installed
      const installed = getInstalledSkill(name);
      if (!installed) {
        error(`Skill '${name}' is not installed`);
        process.exit(1);
      }

      // Confirm removal
      if (!options.yes) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Remove ${chalk.cyan(name)}@${chalk.gray(installed.version)}?`,
          default: false
        }]);

        if (!confirm) {
          warning('Removal cancelled');
          return;
        }
      }

      spinner.start(`Removing ${chalk.cyan(name)}...`);

      const result = await removeSkill(name);

      if (result.success) {
        spinner.succeed(`Removed ${chalk.cyan(name)}`);
      } else {
        spinner.fail(`Failed to remove ${name}`);
        error(result.error || 'Unknown error');
        process.exit(1);
      }
    } catch (err) {
      spinner.fail('Removal failed');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });
