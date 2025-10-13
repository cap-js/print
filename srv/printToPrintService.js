const PrintService = require('./service');
const { print, populateQueueValueHelp } = require('../lib/printUtil');
const cds = require("@sap/cds");
const LOG = cds.log('print');

module.exports = class PrintToPrintService extends PrintService {
  async init() {
    // This service will handle print requests using production REST API
    // Handlers will be registered from cds-plugin.js using printUtil functions
    
    LOG.info('Print service initialized for production mode');
    
    return super.init()
  }

  /**
   * Get available print queues (dummy data for console mode)
   */
  async getQueues(req) {
    // TODO: return the actual queues here as in printUtil.js
    try{
      const result = await populateQueueValueHelp(null, req)
      return result;
     }catch(err){
       console.log(err, 'Feching queues failed')
       return req.error(500, 'Failed to fetch queues');
     }

  }

  /**
   * Print method that prints to real printer via REST API
   * This is called when printer.print() is invoked from other services
   */
  async print(printRequest) {
    const { qname, numberOfCopies, docsToPrint } = printRequest;
    
    LOG.info('===============================');
    LOG.info(`Queue: ${qname || 'DEFAULT'}`);
    LOG.info(`Copies: ${numberOfCopies || 1}`);
    LOG.info(`Documents: ${docsToPrint?.length || 0}`);
    LOG.info('===============================');
    
    // TODO: call actual print functions from printUtil.js
    try{
      const result = await print(null, printRequest)
      console.log(result)
     }catch(err){
       console.log(err, 'Failed to create print tasks')
     }

    return {
      status: 'success',
      message: `Print job sent to ${qname} for ${numberOfCopies} copies`,
      taskId: `console-task-${Date.now()}`
    };
  }
}
