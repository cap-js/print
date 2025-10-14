const PrintService = require('./service');
const { print, getQueues } = require('../lib/printUtil');
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
    try{
      const result = await getQueues(null, req)
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
    
    LOG.info(`Print request received for queue: ${qname}, copies: ${numberOfCopies}, documents: ${docsToPrint?.length || 0}`);   
    try{
      const result = await print(null, printRequest)
      console.log(result);
      
      return {
        status: 'success',
        message: `Print job sent to ${qname} for ${numberOfCopies} copies`,
        taskId: `console-task-${Date.now()}`,
        details: result
      };
     }catch(err){
      console.log(err, 'Failed to create print tasks');
      
      return {
        status: 'error',
        message: `Print job failed for queue ${qname}`,
        error: err.message,
        taskId: `failed-task-${Date.now()}`
      };
     }

  }
}
