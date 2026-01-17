#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { installCommand } from './commands/install.js';
import { searchCommand } from './commands/search.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { updateCommand } from './commands/update.js';
import { infoCommand } from './commands/info.js';
import { loginCommand, logoutCommand, whoamiCommand } from './commands/login.js';
import { publishCommand } from './commands/publish.js';
import { getConfig } from './lib/config.js';
import { getAgentName } from './lib/paths.js';

const program = new Command();

program
  .name('skill-get')
  .description('Package manager for AI Agent Skills')
  .version('0.1.0')
  .configureHelp({
    sortSubcommands: true
  });

// Add commands
program.addCommand(installCommand);
program.addCommand(searchCommand);
program.addCommand(listCommand);
program.addCommand(removeCommand);
program.addCommand(updateCommand);
program.addCommand(infoCommand);
program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(publishCommand);

// Config command
program
  .command('config')
  .description('Show or modify configuration')
  .option('--agent <agent>', 'Set target agent (claude-code, cursor, etc.)')
  .option('--api <url>', 'Set API URL')
  .option('--list', 'List all configuration')
  .action((options: { agent?: string; api?: string; list?: boolean }) => {
    const config = getConfig();

    if (options.list || (!options.agent && !options.api)) {
      console.log(chalk.bold('\nConfiguration:'));
      console.log(`  Agent:       ${chalk.cyan(getAgentName(config.agent))}`);
      console.log(`  Skills Path: ${config.skillsPath}`);
      console.log(`  API URL:     ${config.apiUrl}`);
      console.log(`  Logged in:   ${config.username ? chalk.green(config.username) : chalk.gray('No')}`);
      return;
    }

    if (options.agent) {
      const { setAgent } = require('./lib/config.js');
      setAgent(options.agent);
      console.log(chalk.green('✓') + ` Agent set to ${chalk.cyan(getAgentName(options.agent))}`);
    }

    if (options.api) {
      const { setApiUrl } = require('./lib/config.js');
      setApiUrl(options.api);
      console.log(chalk.green('✓') + ` API URL set to ${chalk.cyan(options.api)}`);
    }
  });

// Browse command - alias for search with no query
program
  .command('browse')
  .description('Browse all available skills')
  .option('-c, --category <category>', 'Filter by category')
  .option('--featured', 'Show only featured skills')
  .action(async (options: { category?: string; featured?: boolean }) => {
    const { api } = await import('./lib/api.js');
    const { formatSkillList, heading } = await import('./lib/ui.js');
    const ora = (await import('ora')).default;

    const spinner = ora('Loading skills...').start();

    try {
      const result = await api.listSkills({
        category: options.category,
        limit: 30
      });

      spinner.stop();

      heading('Available Skills');
      console.log(formatSkillList(result.data || []));
      console.log('\n' + chalk.gray('Install with: skill-get install <name>'));
    } catch (err) {
      spinner.fail('Failed to load skills');
      console.error(err instanceof Error ? err.message : 'Unknown error');
    }
  });

// Parse and run
program.parse();
