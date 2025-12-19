const PrintService = require("./service");
const cds = require("@sap/cds");
const LOG = cds.log("print");

module.exports = class LocalPrintService extends PrintService {
  async init() {
    LOG.info("Print service initialized for console mode");

    return super.init();
  }

  /**
   * Get available print queues (dummy data for console mode)
   */
  async getQueues() {
    const printers = [
      "DEFAULT_PRINTER_1",
      "DEFAULT_PRINTER_2",
      "DEFAULT_PRINTER_3",
      "HP_LASERJET_PRO",
      "CANON_IMAGECLASS",
      "XEROX_WORKCENTRE",
      "OFFICE_PRINTER_01",
      "OFFICE_PRINTER_02",
    ];

    const queues = [];
    printers.forEach((printer) => {
      queues.push({ ID: `${printer}` });
    });

    return queues;
  }

  /**
   * Print method that outputs to console instead of real printer
   * This is called when printer.print() is invoked from other services
   * @param {import('@sap/cds').Request} req - The request object
   */
  async print(req) {
    const { qname: selectedQueue, numberOfCopies, docsToPrint } = req.data;

    LOG.info("Received print request:", JSON.stringify(req.data));

    // Get available queues and validate the selected queue

    LOG.info("===============================");
    LOG.info(`PRINT JOB DETAILS`);
    LOG.info("===============================");
    LOG.info(`Queue ID: ${selectedQueue}`);
    LOG.info(`Copies: ${numberOfCopies}`);
    LOG.info(`Documents: ${docsToPrint?.length || 0}`);
    LOG.info("===============================");

    // Print each document content to console
    if (docsToPrint && docsToPrint.length > 0) {
      docsToPrint.forEach((doc, index) => {
        LOG.info(`\nDocument ${index + 1}: ${doc.fileName}`);
        LOG.info("-------------------------------");
        // Decode base64 content and display
        // Add following lines to show Base64
        // const content = Buffer.from(doc.content, 'base64').toString('utf-8');
        // console.log({ content });

        LOG.info("-------------------------------\n");
      });
    }

    LOG.info(`Print job completed successfully!`);
    LOG.info(`Sent to: ${selectedQueue}`);

    return {
      taskId: `console-task-${Date.now()}`,
    };
  }
};
