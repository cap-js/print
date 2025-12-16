function getServiceCredentials(serviceName) {
  const vcap = JSON.parse(process.env["VCAP_SERVICES"] || "{}");
  return (vcap[serviceName] || [])[0]?.credentials;
}

async function _getToken(authUrl, clientId, clientSecret, isConsumerSpecific, tenantId) {
  try {
    // The header attribute 'X-Zid' is set to the consumer tenant id, this retrieves a consumer-specific JWT (if requested)
    const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${authUrl}/oauth/token?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${authorization}`,
        ...(isConsumerSpecific && { "X-Zid": tenantId }),
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error receiving JWT token:", error.message);
  }
}

async function getServiceToken(serviceName, inTenantId, isConsumerSpecific = true) {
  const srvCredentials = getServiceCredentials(serviceName);
  if (!srvCredentials) {
    console.error(`Missing binding credentials for service "${serviceName}"`);
    throw new Error(`Missing binding credentials for service "${serviceName}"`);
  }

  const tenantId = inTenantId || cds.context?.tenant;
  const clientId = srvCredentials?.uaa?.clientid || srvCredentials?.clientid;
  const clientSecret = srvCredentials?.uaa?.clientsecret || srvCredentials?.clientsecret;
  const authUrl = srvCredentials?.uaa?.url || srvCredentials?.url;

  if (isConsumerSpecific && !tenantId) {
    console.error(
      "Util ServiceCredentials - getServiceToken: tenantId missing for consumer-specific token request",
    );
    throw new Error(`Tenant ID missing during token retrieval for bound service "${serviceName}"`);
  }

  // Security check: A consumer tenant must not receive the token of another consumer tenant
  if (tenantId) {
    const providerTenantID = getServiceCredentials("xsuaa")?.tenantid;
    let currentTenantID = cds.context?.tenant;
    if (providerTenantID !== currentTenantID && currentTenantID !== tenantId) {
      const errorMessage =
        "Util ServiceCredentials - getServiceToken: action not allowed for consumer tenant";
      console.error(errorMessage);
      throw new Error(`Consumer Tenant foreign token retrieval not allowed "${serviceName}"`);
    }
  }

  const responseGetToken = await _getToken(
    authUrl,
    clientId,
    clientSecret,
    isConsumerSpecific,
    tenantId,
  );
  const jwt = responseGetToken?.access_token;
  const expires_in = responseGetToken?.expires_in;

  if (!jwt) {
    console.error(
      "Util ServiceCredentials - getServiceToken: empty token from service",
      serviceName,
    );
    throw new Error(
      `Empty JWT returned from authorization service for bound service "${serviceName}"`,
    );
  }

  return (jwt, expires_in);
}

module.exports = {
  getServiceToken,
  getServiceCredentials,
};
