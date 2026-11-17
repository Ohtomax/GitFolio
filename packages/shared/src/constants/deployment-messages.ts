export const DEPLOYMENT_MESSAGES = {
  QUEUED: 'Waiting for the publishing worker.', BUILDING: 'Generating the saved portfolio.', PUSHING: 'Committing generated files to GitHub.',
  DEPLOYING: 'Waiting for GitHub Pages to finish the matching build.', LIVE: 'GitHub Pages confirmed the portfolio is live.',
  DEPLOYMENT_FAILED: 'Publishing could not finish. Your saved project is preserved.', BUILD_FAILED: 'The GitHub build failed. Open its details and try again.',
  DEPLOYMENT_TIMEOUT: 'Publishing took too long. Check GitHub and try again.', INVALID_SNAPSHOT: 'This deployment has no valid saved snapshot. Start a new deployment.',
  LEGACY_DEPLOYMENT_UNAVAILABLE: 'This unfinished record predates the deployment engine. Start a new deployment.',
  GITHUB_PERMISSION_REQUIRED: 'Authorize GitHub publishing access, then try again.', GITHUB_REAUTH_REQUIRED: 'GitHub authorization expired. Authorize publishing again.',
  GITHUB_ACCOUNT_MISMATCH: 'Use the GitHub account that owns this project.', GITHUB_REPO_CONFLICT: 'The repository is not a compatible GitFolio-managed target. Choose a new name or restore its managed branch.',
  GITHUB_WRITE_CONFLICT: 'The repository changed while publishing. Check GitHub before trying again.', GITHUB_UNAVAILABLE: 'GitHub is unavailable. Try publishing later.',
  GITHUB_NOT_FOUND: 'GitHub could not find the repository or build.', GITHUB_RATE_LIMITED: 'GitHub is limiting publishing requests. Wait before trying again.',
  PROJECT_ARCHIVED: 'Publishing stopped because the project was archived.', PROJECT_NOT_FOUND: 'Publishing stopped because the project was removed.',
} as const;
export type DeploymentLogCode = keyof typeof DEPLOYMENT_MESSAGES;
