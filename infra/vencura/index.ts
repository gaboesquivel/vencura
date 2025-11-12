// Load environment variables from .env file (for local development)
// In CI/CD, these are set via GitHub secrets
import * as dotenv from 'dotenv';
dotenv.config();

import * as gcp from '@pulumi/gcp';
import { getConfig, type Config } from './lib/config';
import { createNetwork, type NetworkResources } from './lib/network';
import { createDatabase, type DatabaseResources } from './lib/database';
import { createSecrets, type SecretResources } from './lib/secrets';
import {
  createServiceAccounts,
  type ServiceAccountResources,
} from './lib/service-accounts';
import {
  createArtifactRegistry,
  type ArtifactRegistryResources,
} from './lib/artifact-registry';
import { createCloudRun, type CloudRunResources } from './lib/cloud-run';
import { createOutputs } from './lib/outputs';

// Get configuration
const config: Config = getConfig();

// Create network resources
const network: NetworkResources = createNetwork(config);

// Create secrets (including auto-generated DB password)
const secrets: SecretResources = createSecrets(config);

// Create service accounts
const serviceAccounts: ServiceAccountResources = createServiceAccounts(
  config,
  secrets,
);

// Create Artifact Registry
const artifactRegistry: ArtifactRegistryResources = createArtifactRegistry(
  config,
  serviceAccounts,
);

// Create database (depends on network and secrets)
const database: DatabaseResources = createDatabase(
  config,
  network,
  secrets.dbPassword,
);

// Grant service accounts access to database connection string secret
// (This must happen after database is created)
const dbConnSecretId = database.dbConnectionStringSecret.secretId;
const cloudRunSaName = `${config.appName}-${config.environment}-cloud-run-sa`;
const cicdSaName = `${config.appName}-${config.environment}-cicd-sa`;

new gcp.secretmanager.SecretIamMember(
  `${cloudRunSaName}-db-conn-secret-access`,
  {
    secretId: dbConnSecretId,
    role: 'roles/secretmanager.secretAccessor',
    member: serviceAccounts.cloudRunServiceAccount.email.apply(
      (email) => `serviceAccount:${email}`,
    ),
  },
  {
    dependsOn: [
      serviceAccounts.cloudRunServiceAccount,
      database.dbConnectionStringSecret,
    ],
  },
);

new gcp.secretmanager.SecretIamMember(
  `${cicdSaName}-db-conn-secret-access`,
  {
    secretId: dbConnSecretId,
    role: 'roles/secretmanager.secretAccessor',
    member: serviceAccounts.cicdServiceAccount.email.apply(
      (email) => `serviceAccount:${email}`,
    ),
  },
  {
    dependsOn: [
      serviceAccounts.cicdServiceAccount,
      database.dbConnectionStringSecret,
    ],
  },
);

// Create Cloud Run service (depends on all other resources)
const cloudRun: CloudRunResources = createCloudRun(
  config,
  network,
  database,
  secrets,
  serviceAccounts,
  artifactRegistry,
);

// Export outputs
const outputs = createOutputs(
  config,
  cloudRun,
  database,
  serviceAccounts,
  secrets,
  network,
  artifactRegistry,
);

export const cloudRunUrl = outputs.cloudRunUrl;
export const databaseConnectionName = outputs.databaseConnectionName;
export const cloudRunServiceAccountEmail = outputs.cloudRunServiceAccountEmail;
export const cicdServiceAccountEmail = outputs.cicdServiceAccountEmail;
export const secretNames = outputs.secretNames;
export const vpcConnectorName = outputs.vpcConnectorName;
export const artifactRegistryUrl = outputs.artifactRegistryUrl;
export const environment = outputs.environment;
export const projectId = outputs.projectId;
export const region = outputs.region;
