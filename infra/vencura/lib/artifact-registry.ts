import * as gcp from '@pulumi/gcp';
import type { Config } from './config';
import { resourceName } from './config';
import type { ServiceAccountResources } from './service-accounts';

export interface ArtifactRegistryResources {
  repository: gcp.artifactregistry.Repository;
}

export function createArtifactRegistry(
  config: Config,
  serviceAccounts: ServiceAccountResources,
): ArtifactRegistryResources {
  const repoName = resourceName(config, 'artifact-registry');

  // Docker repository for container images
  const repository = new gcp.artifactregistry.Repository(repoName, {
    repositoryId: repoName,
    description: `Docker repository for ${config.environment} environment`,
    format: 'DOCKER',
    location: config.region,
    labels: {
      environment: config.environment,
      app: config.appName,
    },
  });

  // IAM binding: CI/CD service account can write
  new gcp.artifactregistry.RepositoryIamMember(
    `${repoName}-cicd-writer`,
    {
      repository: repository.name,
      location: repository.location,
      role: 'roles/artifactregistry.writer',
      member: serviceAccounts.cicdServiceAccount.email.apply(
        (email) => `serviceAccount:${email}`,
      ),
    },
    { dependsOn: [repository, serviceAccounts.cicdServiceAccount] },
  );

  return {
    repository,
  };
}
