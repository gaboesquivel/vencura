import * as gcp from '@pulumi/gcp';
import type { Config } from './config';
export interface NetworkResources {
    vpc: gcp.compute.Network;
    subnet: gcp.compute.Subnetwork;
    vpcConnector: gcp.vpcaccess.Connector;
    privateServiceRange: gcp.compute.GlobalAddress;
    privateServiceConnection: gcp.servicenetworking.Connection;
}
export declare function createNetwork(config: Config): NetworkResources;
//# sourceMappingURL=network.d.ts.map