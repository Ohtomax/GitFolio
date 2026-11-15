export const DEPLOY_STATUSES = [
  'PENDING',
  'BUILDING',
  'PUSHING',
  'DEPLOYING',
  'LIVE',
  'FAILED',
] as const;

export type DeployStatus = (typeof DEPLOY_STATUSES)[number];
