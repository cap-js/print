function getServiceCredentials(serviceName) {
  const vcap = JSON.parse(process.env["VCAP_SERVICES"] || "{}");
  return (vcap[serviceName] || [])[0]?.credentials;
}

async function getServiceToken(serviceName, isTenantSpecific) {
  const srvCredentials = getServiceCredentials(serviceName);
  if (!srvCredentials) {
    throw new Error(`Missing binding credentials for service "${serviceName}"`);
  }

  const tenantId = cds.context?.tenant;
  const clientId = srvCredentials?.uaa?.clientid || srvCredentials?.clientid;
  const clientSecret = srvCredentials?.uaa?.clientsecret || srvCredentials?.clientsecret;
  const authUrl = srvCredentials?.uaa?.url || srvCredentials?.url;

  if (isTenantSpecific && !tenantId) {
    throw new Error(`Tenant ID missing during token retrieval for bound service "${serviceName}"`);
  }

  const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${authUrl}/oauth/token?grant_type=client_credentials`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authorization}`,
      ...(isTenantSpecific && { "X-Zid": tenantId }),
    },
  });

  const responseGetToken = await response.json();

  const jwt = responseGetToken?.access_token;

  if (!jwt) {
    throw new Error(
      `Empty JWT returned from authorization service for bound service "${serviceName}"`,
    );
  }

  const expires_in = responseGetToken?.expires_in;

  return { jwt, expires_in };
}

module.exports = {
  getServiceToken,
  getServiceCredentials,
};
