const PrintService = require("./service");
const cds = require("@sap/cds");
const LOG = cds.log("print");
const {
  getDestinationFromServiceBinding,
  transformServiceBindingToClientCredentialsDestination,
} = require("@sap-cloud-sdk/connectivity");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

module.exports = class PrintToPrintService extends PrintService {
  async init() {
    LOG.info("Productive Print service initialized.");
    return super.init();
  }

  /**
   * Get available print queues
   */
  async getQueues() {
    const result = await _getQueues();
    return result;
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

    const result = await _print(printRequest);

    LOG.info(`Print request successfully processed.`);

    return {
      status: "success",
      message: `Print job sent to ${qname} for ${numberOfCopies} copies`,
      taskId: `console-task-${Date.now()}`,
      details: result,
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
 * Populates the queue value help with available printers.
 * @param {Object} _ - Unused parameter.
 * @param {Object} req - The request object.
 */
const _getQueues = async function () {
  const destination = await getDestination();

  const response = await executeHttpRequest(destination, {
    url: "/qm/api/v1/rest/queues",
    method: "GET",
  });

  const queues = response.data.map((q) => ({ ID: q.qname }));

  return queues;
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
    status: "SUCCESS",
    queue: selectedQueue,
    numberOfCopies,
    taskId: itemId,
  };
};
