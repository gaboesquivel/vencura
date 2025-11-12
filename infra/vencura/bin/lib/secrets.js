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
exports.createSecrets = createSecrets;
const gcp = __importStar(require("@pulumi/gcp"));
const random = __importStar(require("@pulumi/random"));
const config_1 = require("./config");
function createSecrets(config) {
    // Auto-generate database password
    const dbPassword = new random.RandomPassword((0, config_1.secretName)(config, 'db-password-random'), {
        length: 32,
        special: true,
        overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
    });
    // Secret Manager secrets with environment-prefixed names
    const dynamicEnvironmentId = new gcp.secretmanager.Secret((0, config_1.secretName)(config, 'dynamic-environment-id'), {
        secretId: (0, config_1.secretName)(config, 'dynamic-environment-id'),
        replication: { auto: {} },
        labels: {
            environment: config.environment,
            app: config.appName,
        },
    });
    // Create secret version with placeholder (to be updated manually or via CI/CD)
    new gcp.secretmanager.SecretVersion((0, config_1.secretName)(config, 'dynamic-environment-id-version'), {
        secret: dynamicEnvironmentId.id,
        secretData: 'PLACEHOLDER_UPDATE_ME',
    });
    const dynamicApiToken = new gcp.secretmanager.Secret((0, config_1.secretName)(config, 'dynamic-api-token'), {
        secretId: (0, config_1.secretName)(config, 'dynamic-api-token'),
        replication: { auto: {} },
        labels: {
            environment: config.environment,
            app: config.appName,
        },
    });
    new gcp.secretmanager.SecretVersion((0, config_1.secretName)(config, 'dynamic-api-token-version'), {
        secret: dynamicApiToken.id,
        secretData: 'PLACEHOLDER_UPDATE_ME',
    });
    const arbitrumSepoliaRpcUrl = new gcp.secretmanager.Secret((0, config_1.secretName)(config, 'arbitrum-sepolia-rpc-url'), {
        secretId: (0, config_1.secretName)(config, 'arbitrum-sepolia-rpc-url'),
        replication: { auto: {} },
        labels: {
            environment: config.environment,
            app: config.appName,
        },
    });
    new gcp.secretmanager.SecretVersion((0, config_1.secretName)(config, 'arbitrum-sepolia-rpc-url-version'), {
        secret: arbitrumSepoliaRpcUrl.id,
        secretData: 'PLACEHOLDER_UPDATE_ME',
    });
    const encryptionKey = new gcp.secretmanager.Secret((0, config_1.secretName)(config, 'encryption-key'), {
        secretId: (0, config_1.secretName)(config, 'encryption-key'),
        replication: { auto: {} },
        labels: {
            environment: config.environment,
            app: config.appName,
        },
    });
    new gcp.secretmanager.SecretVersion((0, config_1.secretName)(config, 'encryption-key-version'), {
        secret: encryptionKey.id,
        secretData: 'PLACEHOLDER_UPDATE_ME',
    });
    // Database password secret
    const dbPasswordSecret = new gcp.secretmanager.Secret((0, config_1.secretName)(config, 'db-password'), {
        secretId: (0, config_1.secretName)(config, 'db-password'),
        replication: { auto: {} },
        labels: {
            environment: config.environment,
            app: config.appName,
        },
    });
    new gcp.secretmanager.SecretVersion((0, config_1.secretName)(config, 'db-password-version'), {
        secret: dbPasswordSecret.id,
        secretData: dbPassword.result,
    });
    return {
        dbPassword: dbPassword.result,
        secrets: {
            dynamicEnvironmentId,
            dynamicApiToken,
            arbitrumSepoliaRpcUrl,
            encryptionKey,
            dbPassword: dbPasswordSecret,
        },
    };
}
