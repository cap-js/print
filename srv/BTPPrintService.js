const PrintService = require("./service");
const cds = require("@sap/cds");
const LOG = cds.log("print");
const { getServiceToken, getServiceCredentials } = require("../lib/btp-utils");
const TokenCache = require("../lib/token-cache");

const PRINT_SERVICE_NAME = "print";

module.exports = class BTPPrintService extends PrintService {
  tokenCache = new TokenCache();

  async init() {
    return super.init();
  }

  async getQueues(req) {
    const srvUrl = getServiceCredentials(PRINT_SERVICE_NAME)?.service_url;
    const jwt = await this.getToken(cds.context?.tenant);

    const response = await fetch(`${srvUrl}/qm/api/v1/rest/queues`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      LOG.error("Error during Queue retriecal. Response body:", body);
      req.reject(500, `Unexpected error during Queue retrieval ${response.status}`);
    }

    const responseData = await response.json();
    const queues = responseData.map((q) => ({ ID: q.qname }));

    return queues;
  }

  async print(req) {
    const { qname, numberOfCopies, docsToPrint } = req.data;

    LOG.debug(
      `Print request received for queue: ${qname}, copies: ${numberOfCopies}, documents: ${docsToPrint?.length || 0}`,
    );

    await this._print(req);

    LOG.debug(`Print request successfully processed.`);

    return {
      status: "success",
      message: `Print job sent to ${qname} for ${numberOfCopies} copies`,
      taskId: `console-task-${Date.now()}`,
    };
  }

  async _print(req) {
    const tenantId = cds.context?.tenant;
    const { qname: selectedQueue, numberOfCopies, docsToPrint } = req.data;

    const srvUrl = getServiceCredentials(PRINT_SERVICE_NAME)?.service_url;

    let jwt = "";
    try {
      jwt = await this.getToken(tenantId);
    } catch (e) {
      req.reject(500, "Error during token fetching", e.message);
    }

    // 1. Upload documents to be printed
    const uploadPromises = docsToPrint.map(async (doc) => {
      if (!doc.content) {
        req.reject(400, "No content provided for printing");
      }

      const response = await fetch(`${srvUrl}/dm/api/v1/rest/print-documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(doc.content),
      });
      const responseData = await response.text();
      doc.objectKey = responseData;

      if (!response.ok) {
        const body = await response.text();
        LOG.error(`Printing failed during upload of document ${doc.fileName}: `, body);
        req.reject(
          500,
          `Printing failed during upload of document ${doc.fileName} with status ${response.status}`,
        );
      }
    });

    await Promise.all(uploadPromises);

    LOG.info("All documents uploaded successfully");

    let printTask = {
      numberOfCopies: numberOfCopies,
      username: cds.context?.user?.id,
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

    const r = await fetch(`${srvUrl}/qm/api/v1/rest/print-tasks/${itemId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        "If-None-Match": "*",
        ...(tenantId && { "X-Zid": tenantId }),
      },
      body: JSON.stringify(data),
    });

    if (!r.ok) {
      const body = await r.text();
      LOG.error("Print task creation failed. Response body:", body);
      req.reject(500, `Print task creation failed with status ${r.status}`);
    }

    LOG.debug(`Document sent to print queue ${selectedQueue}`);

    return {
      taskId: itemId,
    };
  }

  async getToken(tenantId) {
    const tokenFromCache = this.tokenCache.get(tenantId ?? "single-tenant");
    return (
      tokenFromCache ??
      (await (async () => {
        const { jwt: jwtFromService, expires_in } = await getServiceToken(
          PRINT_SERVICE_NAME,
          cds.context?.tenant !== undefined,
        );
        this.tokenCache.set?.(tenantId ?? "single-tenant", jwtFromService, expires_in);
        return jwtFromService;
      })())
    );
  }
};
