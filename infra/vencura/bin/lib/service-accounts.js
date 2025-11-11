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
exports.createServiceAccounts = createServiceAccounts;
const gcp = __importStar(require("@pulumi/gcp"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const config_1 = require("./config");
function createServiceAccounts(config, secrets) {
    const cloudRunSaName = (0, config_1.resourceName)(config, 'cloud-run-sa');
    const cicdSaName = (0, config_1.resourceName)(config, 'cicd-sa');
    // Cloud Run service account
    const cloudRunServiceAccount = new gcp.serviceaccount.Account(cloudRunSaName, {
        accountId: cloudRunSaName,
        displayName: `Cloud Run service account for ${config.environment}`,
        description: `Service account for Vencura Cloud Run service in ${config.environment}`,
    });
    // IAM binding: Secret Manager accessor (with IAM conditions to limit to specific secrets)
    // Note: dbConnectionStringSecret is added in database module, so we'll add it separately
    const secretNames = [
        secrets.secrets.dynamicEnvironmentId.secretId,
        secrets.secrets.dynamicApiToken.secretId,
        secrets.secrets.arbitrumSepoliaRpcUrl.secretId,
        secrets.secrets.encryptionKey.secretId,
        secrets.secrets.dbPassword.secretId,
    ];
    secretNames.forEach((secretName) => {
        new gcp.secretmanager.SecretIamMember(`${cloudRunSaName}-secret-${secretName}`, {
            secretId: secretName,
            role: 'roles/secretmanager.secretAccessor',
            member: pulumi.interpolate `serviceAccount:${cloudRunServiceAccount.email}`,
        }, { dependsOn: [cloudRunServiceAccount] });
    });
    // IAM binding: Cloud SQL client
    new gcp.projects.IAMMember(`${cloudRunSaName}-cloudsql-client`, {
        project: config.projectId,
        role: 'roles/cloudsql.client',
        member: pulumi.interpolate `serviceAccount:${cloudRunServiceAccount.email}`,
    }, { dependsOn: [cloudRunServiceAccount] });
    // CI/CD service account (for GitHub Actions)
    const cicdServiceAccount = new gcp.serviceaccount.Account(cicdSaName, {
        accountId: cicdSaName,
        displayName: `CI/CD service account for ${config.environment}`,
        description: `Service account for GitHub Actions CI/CD in ${config.environment}`,
    });
    // IAM binding: Artifact Registry writer
    new gcp.projects.IAMMember(`${cicdSaName}-artifact-registry-writer`, {
        project: config.projectId,
        role: 'roles/artifactregistry.writer',
        member: pulumi.interpolate `serviceAccount:${cicdServiceAccount.email}`,
    }, { dependsOn: [cicdServiceAccount] });
    // IAM binding: Cloud Run admin
    new gcp.projects.IAMMember(`${cicdSaName}-run-admin`, {
        project: config.projectId,
        role: 'roles/run.admin',
        member: pulumi.interpolate `serviceAccount:${cicdServiceAccount.email}`,
    }, { dependsOn: [cicdServiceAccount] });
    // IAM binding: Secret Manager accessor (for reading secrets during deployment)
    secretNames.forEach((secretName) => {
        new gcp.secretmanager.SecretIamMember(`${cicdSaName}-secret-${secretName}`, {
            secretId: secretName,
            role: 'roles/secretmanager.secretAccessor',
            member: pulumi.interpolate `serviceAccount:${cicdServiceAccount.email}`,
        }, { dependsOn: [cicdServiceAccount] });
    });
    // IAM binding: Secret Manager admin (for creating/deleting temporary secrets in PR deployments)
    // This allows CI/CD to create ephemeral secrets for PR preview deployments
    new gcp.projects.IAMMember(`${cicdSaName}-secretmanager-admin`, {
        project: config.projectId,
        role: 'roles/secretmanager.admin',
        member: pulumi.interpolate `serviceAccount:${cicdServiceAccount.email}`,
    }, { dependsOn: [cicdServiceAccount] });
    return {
        cloudRunServiceAccount,
        cicdServiceAccount,
    };
}
