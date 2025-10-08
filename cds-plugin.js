const {
    getFieldsHoldingPrintConfig,
    getAnnotatedParamsOfAction,
    getQueueValueHelpEntity
} = require('./lib/annotation-helper');

const {print, populateQueueValueHelp} = require('./lib/printUtil');

const cds = require('@sap/cds');
let queueValueHelpHandlerRegistered = false;

cds.once("served", async () => {
    // Iterate over all services
    for (let srv of cds.services) {
        // Iterate over all entities in the service
        for (let entity of srv.entities) {
            
            // Track the fields holding print configurations
            await getFieldsHoldingPrintConfig(entity);

            // ValueHelp entity handler
            const sourceentity = getQueueValueHelpEntity(entity.elements);
            if (sourceentity) {
                // Register for print related handling
                srv.after('READ', sourceentity, populateQueueValueHelp);
                queueValueHelpHandlerRegistered = true;
            }

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
                        await getAnnotatedParamsOfAction(boundAction);
                        const sourceentity = getQueueValueHelpEntity(boundAction.params);
                        const printer = await cds.connect.to("print");
                        if(sourceentity && !queueValueHelpHandlerRegistered) {
                            srv.after('READ', sourceentity, async (_, req) => {
                                // TODO: make sure the format of all services are the same
                                const q = await printer.getQueues();

                                q.forEach((item, index) => {
                                    req.results[index] = { ID: item.ID };
                                });
                                req.results.$count = q.length;
                                return;

                            });
                        }
                        const actionName = boundAction.name.split('.').pop();

                        // Register for print related handling
                        srv.after(actionName, print);
                    }
                }
            }
        }
    }
});
