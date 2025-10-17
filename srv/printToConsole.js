const PrintService = require('./service');
const cds = require("@sap/cds");
const LOG = cds.log('print');

module.exports = class PrintToConsole extends PrintService {
  async init() {
    LOG.info('Print service initialized for console mode');
    
    return super.init()
  }

  /**
   * Get available print queues (dummy data for console mode)
   */
  async getQueues() {
    return [
            { ID: 'DEFAULT_PRINTER' },
            { ID: 'HP_LASERJET_PRO' },
            { ID: 'CANON_IMAGECLASS' },
            { ID: 'XEROX_WORKCENTRE' },
            { ID: 'OFFICE_PRINTER_01' },
            { ID: 'OFFICE_PRINTER_02' }
        ];
  }

  /**
   * Print method that outputs to console instead of real printer
   * This is called when printer.print() is invoked from other services
   */
  async print(req) {

    let printRequest = req.printRequest;

    const { qname, numberOfCopies, docsToPrint } = printRequest;

    // LOG.info('Received print request:', JSON.stringify(printRequest));
    
    // Get available queues and validate the selected queue
    // const availableQueues = await this.getQueues();
    const selectedQueue = printRequest.qname

    // LOG.info('===============================');
    // LOG.info(`PRINT JOB DETAILS`);
    // LOG.info('===============================');
    // LOG.info(`Queue ID: ${selectedQueue}`);
    // LOG.info(`Copies: ${numberOfCopies}`);
    // LOG.info(`Documents: ${docsToPrint?.length || 0}`);
    // LOG.info('===============================');
    
    // Print each document content to console
    if (docsToPrint && docsToPrint.length > 0) {
      docsToPrint.forEach((doc, index) => {
        LOG.info(`Document ${index + 1}: ${doc.fileName}`);
        LOG.info('-------------------------------');        
        console.log(doc.content.substring(0, 200) + "...");
        LOG.info('-------------------------------\n');
      });
    }
    
    LOG.info(`Print job completed successfully!`);
    LOG.info(`Sent to: ${selectedQueue}`);
    
    return {
      status: 'success',
      message: `Print job sent to ${selectedQueue.ID} for ${numberOfCopies || 1} copies`,
      taskId: `console-task-${Date.now()}`,
      queueUsed: selectedQueue
    };
  }
}