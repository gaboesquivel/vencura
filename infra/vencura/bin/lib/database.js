"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabase = createDatabase;
const gcp = __importStar(require("@pulumi/gcp"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const config_1 = require("./config");
function createDatabase(config, network, dbPassword, provider) {
    const instanceName = (0, config_1.resourceName)(config, 'db');
    const userName = (0, config_1.resourceName)(config, 'db-user');
    const dbName = 'vencura';
    const dbUser = 'vencura';
    // Cloud SQL Postgres instance with private IP only
    const instance = new gcp.sql.DatabaseInstance(instanceName, {
        name: instanceName,
        databaseVersion: 'POSTGRES_15',
        region: config.region,
        settings: {
            tier: config.cloudSqlTier,
            availabilityType: config.cloudSqlHaEnabled ? 'REGIONAL' : 'ZONAL',
            backupConfiguration: {
                enabled: config.cloudSqlBackupEnabled,
                startTime: '03:00',
                pointInTimeRecoveryEnabled: config.cloudSqlBackupEnabled,
                backupRetentionSettings: {
                    retainedBackups: config.cloudSqlBackupEnabled ? 7 : 0,
                    retentionUnit: 'COUNT',
                },
            },
            ipConfiguration: {
                ipv4Enabled: false, // Private IP only
                privateNetwork: network.vpc.id,
                requireSsl: true,
                authorizedNetworks: [], // Empty for private IP
            },
            databaseFlags: [
                {
                    name: 'max_connections',
                    value: '100',
                },
            ],
            insightsConfig: {
                queryInsightsEnabled: true,
                queryStringLength: 1024,
                recordApplicationTags: true,
                recordClientAddress: true,
            },
        },
        deletionProtection: config.environment === 'prod',
    }, { provider, dependsOn: [network.privateServiceConnection] });
    // Database
    const database = new gcp.sql.Database(dbName, {
        name: 'vencura',
        instance: instance.name,
        charset: 'UTF8',
        collation: 'en_US.UTF8',
    }, { provider, dependsOn: [instance] });
    // Database user
    const user = new gcp.sql.User(userName, {
        name: 'vencura',
        instance: instance.name,
        password: dbPassword,
        type: 'BUILT_IN',
    }, { provider, dependsOn: [instance] });
    // Connection name for Cloud Run
    const connectionName = pulumi.interpolate `${config.projectId}:${config.region}:${instance.name}`;
    // Create database connection string secret
    // Format: postgresql://user:password@/database?host=/cloudsql/connection-name
    const dbConnectionStringSecret = new gcp.secretmanager.Secret((0, config_1.secretName)(config, 'db-connection-string'), {
        secretId: (0, config_1.secretName)(config, 'db-connection-string'),
        replication: { auto: {} },
        labels: {
            environment: config.environment,
            app: config.appName,
        },
    }, { provider, dependsOn: [instance] });
    // Create connection string with password from secret
    const connectionString = pulumi
        .all([connectionName, dbPassword])
        .apply(([connName, password]) => `postgresql://${dbUser}:${password}@/${dbName}?host=/cloudsql/${connName}`);
    new gcp.secretmanager.SecretVersion((0, config_1.secretName)(config, 'db-connection-string-version'), {
        secret: dbConnectionStringSecret.id,
        secretData: connectionString,
    }, { provider, dependsOn: [user, dbConnectionStringSecret] });
    return {
        instance,
        database,
        user,
        connectionName,
        databaseName: dbName,
        userName: dbUser,
        dbConnectionStringSecret,
    };
}
