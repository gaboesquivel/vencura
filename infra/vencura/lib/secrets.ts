import * as gcp from '@pulumi/gcp';
import * as random from '@pulumi/random';
import * as pulumi from '@pulumi/pulumi';
import type { Config } from './config';
import { secretName } from './config';

export interface SecretResources {
  dbPassword: pulumi.Output<string>;
  secrets: {
    dynamicEnvironmentId: gcp.secretmanager.Secret;
    dynamicApiToken: gcp.secretmanager.Secret;
    arbitrumSepoliaRpcUrl: gcp.secretmanager.Secret;
    encryptionKey: gcp.secretmanager.Secret;
    dbPassword: gcp.secretmanager.Secret;
  };
}

export function createSecrets(config: Config): SecretResources {
  // Auto-generate database password
  const dbPassword = new random.RandomPassword(
    secretName(config, 'db-password-random'),
    {
      length: 32,
      special: true,
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
    },
  );

  // Secret Manager secrets with environment-prefixed names
  const dynamicEnvironmentId = new gcp.secretmanager.Secret(
    secretName(config, 'dynamic-environment-id'),
    {
      secretId: secretName(config, 'dynamic-environment-id'),
      replication: {},
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
  );

  // Create secret version with placeholder (to be updated manually or via CI/CD)
  new gcp.secretmanager.SecretVersion(
    secretName(config, 'dynamic-environment-id-version'),
    {
      secret: dynamicEnvironmentId.id,
      secretData: 'PLACEHOLDER_UPDATE_ME',
    },
  );

  const dynamicApiToken = new gcp.secretmanager.Secret(
    secretName(config, 'dynamic-api-token'),
    {
      secretId: secretName(config, 'dynamic-api-token'),
      replication: {},
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
  );

  new gcp.secretmanager.SecretVersion(
    secretName(config, 'dynamic-api-token-version'),
    {
      secret: dynamicApiToken.id,
      secretData: 'PLACEHOLDER_UPDATE_ME',
    },
  );

  const arbitrumSepoliaRpcUrl = new gcp.secretmanager.Secret(
    secretName(config, 'arbitrum-sepolia-rpc-url'),
    {
      secretId: secretName(config, 'arbitrum-sepolia-rpc-url'),
      replication: {},
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
  );

  new gcp.secretmanager.SecretVersion(
    secretName(config, 'arbitrum-sepolia-rpc-url-version'),
    {
      secret: arbitrumSepoliaRpcUrl.id,
      secretData: 'PLACEHOLDER_UPDATE_ME',
    },
  );

  const encryptionKey = new gcp.secretmanager.Secret(
    secretName(config, 'encryption-key'),
    {
      secretId: secretName(config, 'encryption-key'),
      replication: {},
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
  );

  new gcp.secretmanager.SecretVersion(
    secretName(config, 'encryption-key-version'),
    {
      secret: encryptionKey.id,
      secretData: 'PLACEHOLDER_UPDATE_ME',
    },
  );

  // Database password secret
  const dbPasswordSecret = new gcp.secretmanager.Secret(
    secretName(config, 'db-password'),
    {
      secretId: secretName(config, 'db-password'),
      replication: {},
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
  );

  new gcp.secretmanager.SecretVersion(
    secretName(config, 'db-password-version'),
    {
      secret: dbPasswordSecret.id,
      secretData: dbPassword.result,
    },
  );

  return {
    dbPassword: dbPassword.result,
    secrets: {
      dynamicEnvironmentId,
      dynamicApiToken,
      arbitrumSepoliaRpcUrl,
      encryptionKey,
      dbPassword: dbPasswordSecret,
    },
  };
}
