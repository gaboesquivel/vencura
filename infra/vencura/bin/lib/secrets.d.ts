import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import type { Config } from './config';
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
export declare function createSecrets(config: Config, provider: gcp.Provider): SecretResources;
//# sourceMappingURL=secrets.d.ts.map