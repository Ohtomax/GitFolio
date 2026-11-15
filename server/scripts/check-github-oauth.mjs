import { EnvironmentError, loadEnvironment } from '../dist/config/env.js';
import { getGitHubOAuthConfiguration } from '../dist/config/github-oauth.js';

try {
  const environment = loadEnvironment();
  const configuration = getGitHubOAuthConfiguration(environment);

  if (!configuration) {
    process.stderr.write(
      'GitHub OAuth credentials are missing. Register the app using docs/GITHUB_OAUTH_SETUP.md,\n' +
      'then set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the root .env file.\n',
    );
    process.exitCode = 1;
  } else {
    process.stdout.write(
      'Local GitHub OAuth configuration is valid.\n' +
      `Homepage URL: ${environment.CLIENT_URL}\n` +
      `Authorization callback URL: ${configuration.callbackUrl}\n` +
      `Sign-in scopes: ${configuration.scopes.join(' ')}\n` +
      'GitHub registration, token exchange, and the login flow have not been verified by this check.\n',
    );
  }
} catch (error) {
  if (error instanceof EnvironmentError) {
    process.stderr.write(`Invalid environment configuration. Check: ${error.fields.join(', ')}\n`);
  } else {
    process.stderr.write('Unable to check GitHub OAuth configuration.\n');
  }
  process.exitCode = 1;
}
