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
exports.createOutputs = createOutputs;
const pulumi = __importStar(require("@pulumi/pulumi"));
function createOutputs(config, cloudRun, database, serviceAccounts, secrets, network, artifactRegistry) {
    return {
        // Cloud Run service URL (safe array access)
        cloudRunUrl: cloudRun.service.statuses.apply((statuses) => statuses && statuses.length > 0 ? (statuses[0]?.url ?? '') : ''),
        // Database connection name
        databaseConnectionName: database.connectionName,
        // Service account emails
        cloudRunServiceAccountEmail: serviceAccounts.cloudRunServiceAccount.email,
        cicdServiceAccountEmail: serviceAccounts.cicdServiceAccount.email,
        // Secret names (for CI/CD)
        secretNames: pulumi.output({
            dynamicEnvironmentId: secrets.secrets.dynamicEnvironmentId.secretId,
            dynamicApiToken: secrets.secrets.dynamicApiToken.secretId,
            arbitrumSepoliaRpcUrl: secrets.secrets.arbitrumSepoliaRpcUrl.secretId,
            encryptionKey: secrets.secrets.encryptionKey.secretId,
            dbPassword: secrets.secrets.dbPassword.secretId,
            dbConnectionString: database.dbConnectionStringSecret.secretId,
        }),
        // VPC Connector name
        vpcConnectorName: network.vpcConnector.name,
        // Artifact Registry repository URL
        artifactRegistryUrl: pulumi.interpolate `${config.region}-docker.pkg.dev/${config.projectId}/${artifactRegistry.repository.repositoryId}`,
        // Environment
        environment: pulumi.output(config.environment),
        // Project ID
        projectId: pulumi.output(config.projectId),
        // Region
        region: pulumi.output(config.region),
    };
}
