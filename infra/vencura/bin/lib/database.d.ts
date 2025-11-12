import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import type { Config } from './config';
import type { NetworkResources } from './network';
export interface DatabaseResources {
    instance: gcp.sql.DatabaseInstance;
    database: gcp.sql.Database;
    user: gcp.sql.User;
    connectionName: pulumi.Output<string>;
    databaseName: string;
    userName: string;
    dbConnectionStringSecret: gcp.secretmanager.Secret;
}
export declare function createDatabase(config: Config, network: NetworkResources, dbPassword: pulumi.Output<string>, provider: gcp.Provider): DatabaseResources;
//# sourceMappingURL=database.d.ts.map