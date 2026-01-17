import { Command } from 'commander';
import chalk from 'chalk';
import { getInstalledSkills } from '../lib/config.js';
import { getSkillsPath, getAgentName } from '../lib/paths.js';
import { getConfig } from '../lib/config.js';
import { formatInstalledSkillList, heading, info } from '../lib/ui.js';

export const listCommand = new Command('list')
  .alias('ls')
  .description('List installed skills')
  .option('--json', 'Output as JSON')
  .action(async (options: { json?: boolean }) => {
    const config = getConfig();
    const skills = getInstalledSkills();
    const skillList = Object.values(skills);

    if (options.json) {
      console.log(JSON.stringify(skillList, null, 2));
      return;
    }

    const agent = getAgentName(config.agent);
    heading(`Installed Skills (${agent})`);

    console.log(formatInstalledSkillList(skillList));

    if (skillList.length > 0) {
      console.log('\n' + chalk.gray(`Skills directory: ${getSkillsPath()}`));
    } else {
      info(`Install skills with: ${chalk.green('skill-get install <name>')}`);
    }
  });
