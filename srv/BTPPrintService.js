const PrintService = require("./service");
const cds = require("@sap/cds");
const LOG = cds.log("print");
const { getServiceToken, getServiceCredentials } = require("../lib/btp-utils");
const TokenCache = require("../lib/token-cache");

const PRINT_SERVICE_NAME = "print";

module.exports = class BTPPrintService extends PrintService {
  tokenCache = new TokenCache();

  async init() {
    LOG.info("Productive Print service initialized.");
    return super.init();
  }

  /**
   * Get available print queues
   */
  async getQueues(req) {
    try {
      const srvUrl = getServiceCredentials(PRINT_SERVICE_NAME)?.service_url;
      const jwt = await this.getToken(cds.context?.tenant);

      const response = await fetch(`${srvUrl}/qm/api/v1/rest/queues`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const responseData = await response.json();
      const queues = responseData.map((q) => ({ ID: q.qname }));

      return queues;
    } catch (e) {
      return req.error(500, "An error occured while fetching print queues: " + e.message);
    }
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

    await this._print(printRequest);

    LOG.info(`Print request successfully processed.`);

    return {
      status: "success",
      message: `Print job sent to ${qname} for ${numberOfCopies} copies`,
      taskId: `console-task-${Date.now()}`,
    };
  }
  /**
   * Handles the print request.
   * @param {Object} req - The request object.
   */
  async _print(printRequest) {
    const tenantId = cds.context?.tenant;
    const { qname: selectedQueue, numberOfCopies, docsToPrint } = printRequest;

    const srvUrl = getServiceCredentials(PRINT_SERVICE_NAME)?.service_url;

    let jwt = "";
    try {
      jwt = await this.getToken(tenantId);
    } catch (e) {
      throw new Error("Error retrieving jwt", e.message);
    }

    // 1. Upload documents to be printed
    const uploadPromises = docsToPrint.map(async (doc) => {
      if (!doc.content) {
        throw new Error("No content provided for printing");
      }
      try {
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
      } catch (e) {
        throw new Error(`Printing failed during upload of document ${doc.fileName}: `, e.message);
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

      const r = await fetch(`${srvUrl}/qm/api/v1/rest/print-tasks/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
          "If-None-Match": "*",
          "X-Zid": tenantId,
        },
        body: JSON.stringify(data),
      });

      if (!r.ok) {
        const body = await r.text();
        LOG.error("Print task creation failed. Response body:", body);
        LOG.debug("Fetch response debug info:", {
          status: r.status,
          statusText: r.statusText,
          ok: r.ok,
          url: r.url,
          redirected: r.redirected,
          type: r.type,
          headers: Object.fromEntries(r.headers.entries()),
        });
        throw new Error(`Print task creation failed with status ${r.status}`);
      }
      LOG.debug("Print task response status:", r.status);
    } catch (e) {
      throw new Error("Printing failed during creation of print task: ", e.message);
    }
    LOG.info(`Document sent to print queue ${selectedQueue}`);

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
    return jwtFromService;
  }
};
