import * as pulumi from '@pulumi/pulumi';
import type { CloudRunResources } from './cloud-run';
import type { DatabaseResources } from './database';
import type { ServiceAccountResources } from './service-accounts';
import type { SecretResources } from './secrets';
import type { NetworkResources } from './network';
import type { ArtifactRegistryResources } from './artifact-registry';
import type { Config } from './config';
export declare function createOutputs(config: Config, cloudRun: CloudRunResources, database: DatabaseResources, serviceAccounts: ServiceAccountResources, secrets: SecretResources, network: NetworkResources, artifactRegistry: ArtifactRegistryResources): Record<string, pulumi.Output<any>>;
//# sourceMappingURL=outputs.d.ts.map