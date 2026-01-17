import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { api } from '../lib/api.js';
import { setToken, clearToken, getConfig, isAuthenticated } from '../lib/config.js';
import { success, error, info, warning } from '../lib/ui.js';

export const loginCommand = new Command('login')
  .description('Log in to MCPSkills registry')
  .action(async () => {
    const spinner = ora();

    // Check if already logged in
    if (isAuthenticated()) {
      const config = getConfig();
      info(`Already logged in as ${chalk.cyan(config.username)}`);

      const { confirm } = await import('inquirer').then(m => m.default.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to log in with a different account?',
        default: false
      }]));

      if (!confirm) {
        return;
      }
    }

    try {
      spinner.start('Initiating device authentication...');

      const deviceResponse = await api.initiateDeviceAuth();

      if (deviceResponse.error || !deviceResponse.data) {
        spinner.fail('Failed to initiate authentication');
        error(deviceResponse.message || 'Unknown error');
        process.exit(1);
      }

      const { device_code, user_code, verification_uri, verification_uri_complete, expires_in, interval } = deviceResponse.data;

      spinner.stop();

      console.log('\n' + chalk.bold('To authenticate, please:'));
      console.log(`\n1. Open this URL in your browser:\n   ${chalk.cyan.underline(verification_uri)}`);
      console.log(`\n2. Enter this code:\n   ${chalk.bold.yellow(user_code)}`);
      console.log('\n' + chalk.gray(`Or open: ${verification_uri_complete}`));

      spinner.start('Waiting for authentication...');

      // Poll for token
      const startTime = Date.now();
      const timeout = expires_in * 1000;
      const pollInterval = (interval || 5) * 1000;

      while (Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const tokenResponse = await api.pollDeviceAuth(device_code);

        if (tokenResponse.error) {
          if (tokenResponse.error === 'authorization_pending') {
            // Keep waiting
            continue;
          }

          if (tokenResponse.error === 'expired_token') {
            spinner.fail('Authentication expired');
            error('Please try again');
            process.exit(1);
          }

          if (tokenResponse.error === 'access_denied') {
            spinner.fail('Authentication denied');
            process.exit(1);
          }

          // Other error
          continue;
        }

        if (tokenResponse.data) {
          // Success!
          const { token, user } = tokenResponse.data;

          setToken(token, user.username);
          api.setToken(token);

          spinner.succeed(`Logged in as ${chalk.cyan(user.username)}`);
          success('You can now publish skills to the registry');
          return;
        }
      }

      spinner.fail('Authentication timed out');
      error('Please try again');
      process.exit(1);

    } catch (err) {
      spinner.fail('Authentication failed');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });

export const logoutCommand = new Command('logout')
  .description('Log out from MCPSkills registry')
  .action(async () => {
    if (!isAuthenticated()) {
      warning('Not logged in');
      return;
    }

    const config = getConfig();
    clearToken();
    success(`Logged out from ${chalk.cyan(config.username)}`);
  });

export const whoamiCommand = new Command('whoami')
  .description('Show current logged-in user')
  .action(async () => {
    const config = getConfig();

    if (!isAuthenticated()) {
      info('Not logged in');
      info(`Log in with: ${chalk.green('skill-get login')}`);
      return;
    }

    console.log(chalk.cyan(config.username));
  });
