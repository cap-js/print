const {
    getFieldsHoldingPrintConfig,
    getAnnotatedParamsOfAction
} = require('./lib/annotation-helper');

const cds = require('@sap/cds');

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

            // Track the fields holding print configurations
            await getFieldsHoldingPrintConfig(entity);

            // Check if the entity has actions
            if (entity.actions) {
                let actionsArray;

                // Convert actions to an array if it's an object
                if (Array.isArray(entity.actions)) {
                  actionsArray = entity.actions;
                } else if (typeof entity.actions === 'object') {
                  actionsArray = Object.values(entity.actions);
                }

                // Iterate over all bound actions
                for (let boundAction of actionsArray) {
                    if(boundAction['@print']) {
                        
                        // Track the action parameters holding print configurations
                        getAnnotatedParamsOfAction(boundAction);

                        const actionName = boundAction.name.split('.').pop();

                        // Register for print related handling
                         const printer = await cds.connect.to("print");
                        srv.after(actionName, async (results, req) => {
                            return printer.print(req);
                        });
                    }
                }
            }
        }
    }
});
