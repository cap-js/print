const PrintService = require("./service");
const cds = require("@sap/cds");
const LOG = cds.log("print");
const {
  getDestinationFromServiceBinding,
  transformServiceBindingToClientCredentialsDestination,
} = require("@sap-cloud-sdk/connectivity");
const { executeHttpRequest, executeHttpRequestWithOrigin } = require("@sap-cloud-sdk/http-client");

module.exports = class BTPPrintService extends PrintService {
  async init() {
    LOG.info("Productive Print service initialized.");
    return super.init();
  }

  _getServiceCredentials(serviceName) {
    const vcap = JSON.parse(process.env["VCAP_SERVICES"] || "{}");
    return (vcap[serviceName] || [])[0]?.credentials;
  }

  async _getToken(authUrl, clientId, clientSecret, isConsumerSpecific, tenantId) {
    try {
      // The header attribute 'X-Zid' is set to the consumer tenant id, this retrieves a consumer-specific JWT (if requested)
      const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const response = await executeHttpRequest(
        {
          url: `${authUrl}/oauth/token?grant_type=client_credentials`,
        },
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${authorization}`,
            ...(isConsumerSpecific && { "X-Zid": tenantId }),
          },
        },
      );
      return response;
    } catch (error) {
      console.error("Error receiving JWT token:", error.message);
    }
  }

  // The parameter getToken is used for unit tests and allows a dependency injection; by default the internal implementation _getToken() is used
  async getServiceToken(
    serviceName,
    inTenantId,
    isConsumerSpecific = true,
    getToken = this._getToken, //changed
  ) {
    const srvCredentials = this._getServiceCredentials(serviceName);
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
      throw new Error(
        `Tenant ID missing during token retrieval for bound service "${serviceName}"`,
      );
    }

    // Security check: A consumer tenant must not receive the token of another consumer tenant
    if (tenantId) {
      const providerTenantID = this._getServiceCredentials("xsuaa")?.tenantid;
      let currentTenantID = cds.context?.tenant;
      if (providerTenantID !== currentTenantID && currentTenantID !== tenantId) {
        const errorMessage =
          "Util ServiceCredentials - getServiceToken: action not allowed for consumer tenant";
        console.error(errorMessage);
        throw new Error(`Consumer Tenant foreign token retrieval not allowed "${serviceName}"`);
      }
    }

    const responseGetToken = await getToken(
      authUrl,
      clientId,
      clientSecret,
      isConsumerSpecific,
      tenantId,
    );
    const jwt = responseGetToken?.data?.access_token;

    if (!jwt) {
      console.error(
        "Util ServiceCredentials - getServiceToken: empty token from service",
        serviceName,
      );
      throw new Error(
        `Empty JWT returned from authorization service for bound service "${serviceName}"`,
      );
    }

    return jwt;
  }

  /**
   * Get available print queues
   */
  async getQueues() {
    const srvUrl = this._getServiceCredentials("print")?.service_url;
    let jwt = "";
    try {
      jwt = await this.getServiceToken("print");
    } catch (e) {
      console.error("ACTION print: Error retrieving jwt", e.message);
      throw new Error(httpCodes.internal_server_error, "ACTION_PRINT_NO_ACCESS");
    }

    // hier auf custom url and token
    const response = await executeHttpRequest(
      {
        url: `${srvUrl}/qm/api/v1/rest/queues`,
      },
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${authorization}`,
          // ...(isConsumerSpecific && { "X-Zid": tenantId }),
        },
      },
    );

    const queues = response.data.map((q) => ({ ID: q.qname }));

    return queues;
  }

  /**
   * Print method that prints to real printer via REST API
   * This is called when printer.print() is invoked from other services
   */
  async print(printRequest) {
    const { qname, numberOfCopies, docsToPrint } = printRequest;

    LOG.info(
      `Print request received for queue: ${qname}, copies: ${numberOfCopies}, documents: ${docsToPrint?.length || 0}`,
    );

    await _print(printRequest);

    LOG.info(`Print request successfully processed.`);

    return {
      status: "success",
      message: `Print job sent to ${qname} for ${numberOfCopies} copies`,
      taskId: `console-task-${Date.now()}`,
    };
  }
};

const getDestination = async () => {
  const destination = await getDestinationFromServiceBinding({
    destinationName: "print-service",
    useCache: false,
    serviceBindingTransformFn: async function (service, options) {
      return transformServiceBindingToClientCredentialsDestination(
        Object.assign(service, {
          credentials: service.credentials.uaa,
          url: service.credentials.service_url,
        }),
        options,
      );
    },
  });

  return destination;
};

/**
 * Handles the print request.
 * @param {Object} _ - Unused parameter.
 * @param {Object} req - The request object.
 */
const _print = async function (printRequest) {
  const { qname: selectedQueue, numberOfCopies, docsToPrint } = printRequest;

  cds.log("=== REQUEST BASIC INFO ===");
  const destination = await getDestination();

  // 1. Upload documents to be printed
  const uploadPromises = docsToPrint.map(async (doc) => {
    if (!doc.content) {
      LOG.error("No content provided for printing");
      throw new Error("No content provided for printing");
    }
    try {
      const response = await executeHttpRequest(destination, {
        url: "/dm/api/v1/rest/print-documents",
        method: "POST",
        data: doc.content,
      });
      doc.objectKey = response.data;
    } catch (e) {
      LOG.error(`Error in uploading document ${doc.fileName}: `, e.message);
      throw new Error(`Printing failed during upload of document ${doc.fileName}.`);
    }
  });

  await Promise.all(uploadPromises);

  LOG.info("All documents uploaded successfully");

  let printTask = {
    numberOfCopies: numberOfCopies,
    username: cds.context?.user?.id,
    // username: "preceiver",
    qname: selectedQueue,
    printContents: [],
  };
  docsToPrint.forEach(async (doc) => {
    printTask.printContents.push({
      objectKey: doc.objectKey,
      documentName: doc.fileName,
    });
  });

  // 2. Print Task
  const itemId = printTask.printContents[0].objectKey;
  try {
    const data = {
      ...printTask,
      metadata: {
        business_metadata: {
          business_user: printTask.username,
          object_node_type: "object_node_1",
        },
        version: 1.2,
      },
    };

    await executeHttpRequest(destination, {
      url: `/qm/api/v1/rest/print-tasks/${itemId}`,
      method: "put",
      data,
      headers: { requestConfig: { "If-None-Match": "*" } },
    });
  } catch (e) {
    LOG.error("Error in sending to print queue: ", e.message);
    throw new Error("Printing failed during creation of print task.");
  }
  LOG.info(`Document sent to print queue ${selectedQueue}`);

  return {
    taskId: itemId,
  };
};
