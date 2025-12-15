const PrintService = require("./service");
const cds = require("@sap/cds");
const LOG = cds.log("print");
const { getServiceToken, getServiceCredentials } = require("../lib/btp-utils");
const { TokenCache } = require("../lib/TokenCache");

module.exports = class BTPPrintService extends PrintService {
  tokenCache = new TokenCache();

  async init() {
    LOG.info("Productive Print service initialized.");
    return super.init();
  }

  /**
   * Get available print queues
   */
  async getQueues() {
    const srvUrl = getServiceCredentials("print")?.service_url;
    let jwt = "";
    try {
      jwt = await this.getToken(cds.context?.tenant);
    } catch (e) {
      console.error("ACTION print: Error retrieving jwt", e.message);
      req.error(500, "No access to print service.");
    }

    const response = await fetch(`${srvUrl}/qm/api/v1/rest/queues`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    const responseData = await response.json();
    const queues = responseData.map((q) => ({ ID: q.qname }));

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
   * @param {Object} _ - Unused parameter.
   * @param {Object} req - The request object.
   */
  async _print(printRequest) {
    const tenantId = cds.context?.tenant;
    const { qname: selectedQueue, numberOfCopies, docsToPrint } = printRequest;

    cds.log("=== REQUEST BASIC INFO ===");
    const srvUrl = getServiceCredentials("print")?.service_url;

    let jwt = "";
    try {
      jwt = await this.getToken(tenantId);
    } catch (e) {
      LOG.error("ACTION print: Error retrieving jwt", e.message);
      throw new Error("No access to print service.");
    }

    // 1. Upload documents to be printed
    const uploadPromises = docsToPrint.map(async (doc) => {
      if (!doc.content) {
        LOG.error("No content provided for printing");
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
        console.error("Print task creation failed. Response body:", body);
        console.error("Fetch response debug info:", {
          status: r.status,
          statusText: r.statusText,
          ok: r.ok,
          url: r.url,
          redirected: r.redirected,
          type: r.type,
          headers: Object.fromEntries(r.headers.entries()),
          // body is a stream; log body content separately after reading with r.text() or r.json()
        });
        throw new Error(`Print task creation failed with status ${r.status}`);
      }
      console.log("Print task response status:", r.status);
    } catch (e) {
      LOG.error("Error in sending to print queue: ", e.message);
      throw new Error("Printing failed during creation of print task.");
    }
    LOG.info(`Document sent to print queue ${selectedQueue}`);

    return {
      taskId: itemId,
    };
  }

  async getToken(tenantId) {
    const tokenFromCache = this.tokenCache.get(tenantId);
    return (
      tokenFromCache ??
      (await (async () => {
        const [jwtFromService, expires_in] = await getServiceToken("print");
        this.tokenCache.set?.(tenantId, jwtFromService, expires_in);
        return jwtFromService;
      })())
    );
  }
};
