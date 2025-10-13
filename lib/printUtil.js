const { getJwt, readVcapServices } = require("./authUtil");
const { getPrintConfigFromActionOrEntity } = require('./annotation-helper');
const cds = require('@sap/cds');
const axios = require('axios');
const logger = cds.log("print");

/**
 * Populates the queue value help with available printers.
 * @param {Object} _ - Unused parameter.
 * @param {Object} req - The request object.
 */
const populateQueueValueHelp = async function (_, req) {

        const vcap = await readVcapServices();
        if (!vcap || vcap?.status === 500) {
            // For Production, return the error if print service is not found
            logger.error('Print service not found');
            return req.error(500, 'Print service not found');
        }
        const jwt = await getJwt(req, vcap);
        if (jwt?.code === 500) {
            logger.error('Failed to retrieve token');
            return req.error(500, 'Failed to retrieve token');
        }

        const api = axios.create({
            baseURL: vcap.service_url,
            headers: {
                'Authorization': `Bearer ${jwt}`,
                "Accept": "*/*",
                "Content-Type": "application/json"
            }
        });
        let resp;
        try {
          resp = await api.get('/qm/api/v1/rest/queues');
        } catch (e) {
          logger.error('Failed to fetch queues', e.response?.data || e.message);
          return req.error(500, 'Failed to fetch queues');
        }
    
        const results = Array.isArray(resp.data)
          ? resp.data.map(q => ({ ID: q.qname }))
          : [];
        results.$count = results.length;
        return results;

}

/**
 * Handles the print request.
 * @param {Object} _ - Unused parameter.
 * @param {Object} req - The request object.
 */
const print = async function (_, req) {

    console.log('=== REQUEST BASIC INFO ===');
    console.log('Event:', req.event);
    console.log('Target:', req.target?.name);
    console.log('User ID:', req.user?.id);
    
    let qname, numberOfCopies, docsToPrint;

    if (req?.target?.name) {
      const printConfig = await getPrintConfigFromActionOrEntity(req);
      ({ qname, numberOfCopies, docsToPrint } = printConfig);
    } else {
        ({ qname, numberOfCopies, docsToPrint } = req);
    }

        const vcap = await readVcapServices(req);
        if (!vcap || vcap?.status === 500) {
            // For Production, return the error if print service is not found
            logger.error('Print service not found');
            return req.error(500, 'Print service not found');
        }
        const jwt = await getJwt(req, vcap);
        if (jwt?.code === 500) {
            logger.error('Failed to retrieve token');
            return req.error(500, 'Failed to retrieve token');
        }

        const api = axios.create({
            baseURL: vcap.service_url,
            headers: {
                'Authorization': `Bearer ${jwt}`,
                "DataServiceVersion": "2.0",
                "Accept": "*/*",
                "Content-Type": "application/json",
                'If-None-Match': '*',
                'scan': true
            }
        });

        // Upload documents to be printed
        for (const doc of docsToPrint) {
            if (!doc.content) {
                logger.error('No content provided for printing');
                return req.error('No content provided for printing');
            }
            let documentResp;
            try {
                documentResp = await api.post('/dm/api/v1/rest/print-documents', doc.content);
                doc.objectKey = documentResp.data;
            } catch (e) {
                logger.error(`Error in uploading document ${doc.fileName}: `, e.response?.data?.error?.message);
                return req.error(e.response?.data?.error?.message);
            }
        }

        let printTask = {
            numberOfCopies: numberOfCopies,
            username: cds.context?.user?.id,
            qname: qname,
            printContents: []
        }
        let itemId = "";
        // Create Print Content
        docsToPrint.forEach(async (doc) => {
            printTask.printContents.push({
                objectKey: doc.objectKey,
                documentName: doc.fileName
            })

            if (doc.isMainDocument) {
                itemId = doc.objectKey;
            }
        });

        // Print Task
        let printTaskResp;
            try {
                printTaskResp = await api.put(`/qm/api/v1/rest/print-tasks/${itemId}`, printTask);
            } catch (e) {
                logger.error('Error in sending to print queue: ', e.response?.data?.error?.message);
                return req.error('Print task failed');
            }
            logger.info(`Document sent to print queue ${qname}`);
            // return req.info(200, `Document sent to print queue ${qname} \n 
            //         No. of copies requested: ${numberOfCopies}`);
            return {
                status: 'SUCCESS',
                queue: qname,
                numberOfCopies,
                taskId: itemId,
                rawResponse: printTaskResp?.data
            };
}

module.exports = { print, populateQueueValueHelp };
