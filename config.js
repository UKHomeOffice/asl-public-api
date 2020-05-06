module.exports = {
  port: process.env.PORT || 8080,
  workflow: process.env.WORKFLOW_SERVICE,
  auth: {
    realm: process.env.KEYCLOAK_REALM,
    url: process.env.KEYCLOAK_URL,
    client: process.env.KEYCLOAK_CLIENT,
    secret: process.env.KEYCLOAK_SECRET,
    permissions: process.env.PERMISSIONS_SERVICE
  },
  db: {
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USERNAME,
    application_name: 'public-api',
    maxConnections: parseInt(process.env.DATABASE_POOL_SIZE, 10) || 5
  }
};
