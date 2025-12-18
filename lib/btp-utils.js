const { XsuaaService } = require("@sap/xssec");

const getServiceCredentials = (name) => (cds?.env?.requires[name] || [])?.credentials;

async function getServiceToken(serviceName) {
  const srvCredentials = getServiceCredentials(serviceName);
  if (!srvCredentials) {
    throw new Error(`Missing binding credentials for service "${serviceName}"`);
  }

  const tenantId = cds.context?.tenant;
  const xsuaaService = new XsuaaService(srvCredentials.uaa);
  const { access_token: jwt, expires_in } = await xsuaaService.fetchClientCredentialsToken({
    ...(tenantId && { zid: tenantId }),
  });

  if (!jwt) {
    throw new Error(
      `Empty JWT returned from authorization service for bound service "${serviceName}"`,
    );
  }

  return { jwt, expires_in };
}

module.exports = {
  getServiceToken,
  getServiceCredentials,
};
