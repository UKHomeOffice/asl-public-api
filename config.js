module.exports = {
  port: process.env.PORT || 8081,
  workflow: process.env.WORKFLOW_SERVICE || 'http://localhost:8083',
  search: process.env.SEARCH_SERVICE || 'http://localhost:8091',
  auth: {
    realm: process.env.KEYCLOAK_REALM || 'Asl-dev',
    url: process.env.KEYCLOAK_URL || 'https://sso-dev.notprod.homeoffice.gov.uk/auth',
    client: process.env.KEYCLOAK_CLIENT || 'asl-dev-connect',
    secret: process.env.KEYCLOAK_SECRET || 'e4dcde1f-ac66-4a29-8883-d349cc478a81',
    permissions: process.env.PERMISSIONS_SERVICE || 'http://localhost:8082',
    adminUsername: process.env.KEYCLOAK_USERNAME || 'asl-resolver',
    adminPassword: process.env.KEYCLOAK_PASSWORD || 'm5FqYQ7oPrBS64DJo54m584N'
  },
  db: {
    database: process.env.DATABASE_NAME || 'asl',
    host: process.env.DATABASE_HOST || 'localhost',
    password: process.env.DATABASE_PASSWORD || 'test-password',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USERNAME || 'postgres',
    application_name: 'public-api',
    maxConnections: parseInt(process.env.DATABASE_POOL_SIZE, 10) || 5
  },
  bodySizeLimit: process.env.BODY_SIZE_LIMIT
};
