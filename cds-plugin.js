const {
    getFieldsHoldingPrintConfig,
    getAnnotatedParamsOfAction,
    getPrintParamsAttributeFromAction
} = require('./lib/annotation-helper');

const cds = require('@sap/cds');
const LOG = cds.log('print');

const PRINT = "@print";

cds.once("served", async () => {
    // Iterate over all services
    for (let srv of cds.services) {
        // Iterate over all entities in the service
        for (let entity of srv.entities) {

            if (entity.projection?.from.ref[0] === "sap.print.Queues") {
                const printer = await cds.connect.to("print");

                srv.after('READ', entity, async (_, req) => {
                    const q = await printer.getQueues();
                    q.forEach((item, index) => {
                        req.results[index] = { ID: item.ID };
                    });
                    req.results.$count = q.length;
                    return;
                });
            }

            if(!entity.actions) continue

            for(const action of entity.actions) {
                if(action[PRINT]) {

                    const printer = await cds.connect.to("print");

                    const { numberOfCopiesAttribute, queueIDAttribute, fileNameAttribute, contentAttribute } = getPrintParamsAttributeFromAction(entity, action);

                    srv.on(action.name, entity, async (req) => {


                        const numberOfCopies = req.data[numberOfCopiesAttribute];
                        const queueID = req.data[queueIDAttribute];

                        const object = await SELECT.one.from(req.subject).columns([fileNameAttribute, contentAttribute]);

                        try {

                            await printer.print({
                                qname: queueID, 
                                numberOfCopies: numberOfCopies,
                                docsToPrint: [{
                                    fileName: object[fileNameAttribute],
                                    content: object[contentAttribute].toString('base64'),
                                    isMainDocument: true
                                }]
                            })

                        }
                        catch (error) {
                            LOG.error(error)
                            req.reject(500, `Printing failed: ${error.message ?? "Unknown error"}`);
                        }


                    });
                }
            }
        }
    }
});
