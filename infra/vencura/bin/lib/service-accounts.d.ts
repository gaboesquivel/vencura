import * as gcp from '@pulumi/gcp';
import type { Config } from './config';
import type { SecretResources } from './secrets';
export interface ServiceAccountResources {
    cloudRunServiceAccount: gcp.serviceaccount.Account;
    cicdServiceAccount: gcp.serviceaccount.Account;
}
export declare function createServiceAccounts(config: Config, secrets: SecretResources): ServiceAccountResources;
//# sourceMappingURL=service-accounts.d.ts.map