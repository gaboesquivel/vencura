import * as gcp from '@pulumi/gcp';
import type { Config } from './config';
import type { ServiceAccountResources } from './service-accounts';
export interface ArtifactRegistryResources {
    repository: gcp.artifactregistry.Repository;
}
export declare function createArtifactRegistry(config: Config, serviceAccounts: ServiceAccountResources): ArtifactRegistryResources;
//# sourceMappingURL=artifact-registry.d.ts.map