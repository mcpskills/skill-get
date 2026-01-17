import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { api } from '../lib/api.js';
import { formatSkillList, error, heading } from '../lib/ui.js';

export const searchCommand = new Command('search')
  .description('Search for skills in the registry')
  .argument('[query]', 'Search query')
  .option('-c, --category <category>', 'Filter by category')
  .option('-s, --sort <sort>', 'Sort by: downloads, rating, newest, updated', 'downloads')
  .option('-l, --limit <limit>', 'Number of results', '20')
  .option('-p, --page <page>', 'Page number', '1')
  .option('--json', 'Output as JSON')
  .action(async (query: string | undefined, options: {
    category?: string;
    sort?: string;
    limit?: string;
    page?: string;
    json?: boolean;
  }) => {
    const spinner = ora();

    try {
      spinner.start('Searching skills...');

      const result = await api.search(query || '', {
        type: 'skill',
        page: parseInt(options.page || '1', 10),
        limit: parseInt(options.limit || '20', 10)
      });

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (query) {
        heading(`Search results for "${query}"`);
      } else {
        heading('Available Skills');
      }

      console.log(formatSkillList(result.data));

      if (result.pagination.has_more) {
        console.log('\n' + chalk.gray(`Showing ${result.data.length} of ${result.pagination.total} results. Use --page to see more.`));
      }

      console.log('\n' + chalk.gray(`Install with: skill-get install <name>`));
    } catch (err) {
      spinner.fail('Search failed');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });
