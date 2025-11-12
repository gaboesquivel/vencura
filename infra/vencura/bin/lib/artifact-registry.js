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
exports.createArtifactRegistry = createArtifactRegistry;
const gcp = __importStar(require("@pulumi/gcp"));
const config_1 = require("./config");
function createArtifactRegistry(config, serviceAccounts, provider) {
    const repoName = (0, config_1.resourceName)(config, 'artifact-registry');
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
    }, { provider });
    // IAM binding: CI/CD service account can write
    new gcp.artifactregistry.RepositoryIamMember(`${repoName}-cicd-writer`, {
        repository: repository.name,
        location: repository.location,
        role: 'roles/artifactregistry.writer',
        member: serviceAccounts.cicdServiceAccount.email.apply((email) => `serviceAccount:${email}`),
    }, { provider, dependsOn: [repository, serviceAccounts.cicdServiceAccount] });
    return {
        repository,
    };
}
