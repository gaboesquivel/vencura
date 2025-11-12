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
exports.createNetwork = createNetwork;
const gcp = __importStar(require("@pulumi/gcp"));
const config_1 = require("./config");
function createNetwork(config, provider) {
    const vpcName = (0, config_1.resourceName)(config, 'vpc');
    const subnetName = (0, config_1.resourceName)(config, 'subnet');
    const connectorName = (0, config_1.resourceName)(config, 'vpc-connector');
    // Dedicated VPC for isolation
    const vpc = new gcp.compute.Network(vpcName, {
        name: vpcName,
        autoCreateSubnetworks: false,
        description: `VPC for ${config.environment} environment`,
    }, { provider });
    // Private subnet with secondary IP range for Cloud SQL
    const subnet = new gcp.compute.Subnetwork(subnetName, {
        name: subnetName,
        ipCidrRange: '10.0.0.0/24',
        region: config.region,
        network: vpc.id,
        privateIpGoogleAccess: true,
        secondaryIpRanges: [
            {
                rangeName: 'pods',
                ipCidrRange: '10.1.0.0/16',
            },
            {
                rangeName: 'services',
                ipCidrRange: '10.2.0.0/16',
            },
        ],
    }, { provider, dependsOn: [vpc] });
    // VPC Connector for serverless VPC access
    const vpcConnector = new gcp.vpcaccess.Connector(connectorName, {
        name: connectorName,
        region: config.region,
        network: vpc.name,
        ipCidrRange: '10.8.0.0/28',
        minInstances: 2,
        maxInstances: 3,
        machineType: 'e2-micro',
    }, { provider, dependsOn: [subnet] });
    // Allocate IP range for Private Service Connection
    const privateServiceRange = new gcp.compute.GlobalAddress((0, config_1.resourceName)(config, 'private-service-range'), {
        name: (0, config_1.resourceName)(config, 'private-service-range'),
        purpose: 'VPC_PEERING',
        addressType: 'INTERNAL',
        prefixLength: 16,
        network: vpc.id,
    }, { provider, dependsOn: [vpc] });
    // Private Service Connection for Cloud SQL
    const privateServiceConnection = new gcp.servicenetworking.Connection((0, config_1.resourceName)(config, 'private-service-connection'), {
        network: vpc.id,
        service: 'servicenetworking.googleapis.com',
        reservedPeeringRanges: [privateServiceRange.name],
    }, { provider, dependsOn: [subnet, privateServiceRange] });
    // Firewall rule: Allow egress to Cloud SQL (Postgres port 5432)
    // VPC Connector handles routing, but we allow egress for Cloud SQL access
    new gcp.compute.Firewall((0, config_1.resourceName)(config, 'allow-cloudsql-egress'), {
        name: (0, config_1.resourceName)(config, 'allow-cloudsql-egress'),
        network: vpc.name,
        description: 'Allow egress to Cloud SQL Postgres from VPC',
        direction: 'EGRESS',
        priority: 1000,
        allows: [
            {
                protocol: 'tcp',
                ports: ['5432'],
            },
        ],
        destinationRanges: ['10.0.0.0/8'], // Private IP ranges for Cloud SQL
    }, { provider, dependsOn: [vpc, subnet] });
    return {
        vpc,
        subnet,
        vpcConnector,
        privateServiceRange,
        privateServiceConnection,
    };
}
