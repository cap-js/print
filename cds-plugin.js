const cds = require("@sap/cds");

const PRINT = "@print";
const PRINT_NUMBER_OF_COPIES = "@print.numberOfCopies";
const PRINT_QUEUE = "@print.queue";
const PRINT_FILE_NAME = "@print.fileName";
const PRINT_FILE_CONTENT = "@print.fileContent";

const QUEUE_ENTITY_NAME = "sap.print.Queues";

cds.once("served", async () => {
  const printer = await cds.connect.to("print");
  for (let srv of cds.services) {
    // Iterate over all entities in the service
    for (let entity of srv.entities) {
      const queueEntities = [];
      if (entity.projection?.from.ref[0] === QUEUE_ENTITY_NAME) {
        queueEntities.push(entity);
      }
      if (queueEntities.length > 0) {
        srv.prepend(() => {
          srv.on("READ", queueEntities, async (req) => {
            const queues = await printer.getQueues();

            return applyOdataRequestOptions(queues, req);
          });
        });
      }

      if (!entity.actions) continue;

      for (const action of entity.actions) {
        if (action[PRINT]) {
          const { numberOfCopiesAttribute, queueIDAttribute, fileNameAttribute, contentAttribute } =
            getPrintParamsAttributeFromAction(entity, action);

          srv.on(action.name, entity, async (req) => {
            const numberOfCopies = req.data[numberOfCopiesAttribute];
            const queueID = req.data[queueIDAttribute];

            const object = await SELECT.one
              .from(req.subject)
              .columns([fileNameAttribute, contentAttribute]);

            if (!object) return req.reject(404, `Object not found for printing.`);
            if (!numberOfCopies)
              return req.reject(400, `Please specify number of copies to print.`);
            if (!queueID) return req.reject(400, `Please specify print queue.`);

            const streamToBase64 = async (stream) => {
              const chunks = [];
              for await (const chunk of stream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
              return Buffer.concat(chunks).toString("base64");
            };
            try {
              await printer.print({
                qname: queueID,
                numberOfCopies: numberOfCopies,
                docsToPrint: [
                  {
                    fileName: object[fileNameAttribute],
                    content: await streamToBase64(object[contentAttribute]),
                    isMainDocument: true,
                  },
                ],
              });

              return req.info({
                status: 200,
                message: `Print job for file ${object[fileNameAttribute]} sent to queue ${queueID} for ${numberOfCopies} copies.`,
              });
            } catch (error) {
              return req.reject(500, `Error: ${error.message ?? "Unknown error"}`);
            }
          });
        }
      }
    }
  }
});

function getPrintParamsAttributeFromAction(entity, action) {
  const copiesElement = Object.values(action.params).find((el) => el[PRINT_NUMBER_OF_COPIES]);
  const queueElement = Object.values(action.params).find((el) => el[PRINT_QUEUE]);

  const fileName = Object.values(entity.elements).find((el) => el[PRINT_FILE_NAME]);
  const content = Object.values(entity.elements).find((el) => el[PRINT_FILE_CONTENT]);

  if ((!copiesElement || !queueElement, !fileName || !content)) {
    cds.error(
      `Print action ${action.name} is missing required annotations. Make sure @print.numberOfCopies, @print.queue are present in the action and @print.fileName and @print.fileContent are present in the entity.`,
    );
  }

  return {
    numberOfCopiesAttribute: copiesElement.name,
    queueIDAttribute: queueElement.name,
    fileNameAttribute: fileName.name,
    contentAttribute: content.name,
  };
}

// only works for entities as projections on queue entity defined in index.cds
// Use case: provide VH to FE as SAP Print service provides a REST endpoint to get queues
function applyOdataRequestOptions(queues, req) {
  let result = queues;

  const {
    $search: search,
    $filter: filter,
    $skip: skip,
    $top: top,
    $count: count,
    $orderby: orderby,
  } = req._.req.query;

  if (filter) {
    // only allow filtering by ID eq '<value>', as only VH should be supported by now
    const filterParts = filter.split(" ");
    if (filterParts.length !== 3 || filterParts[0] !== "ID" || filterParts[1] !== "eq") {
      return req.reject(400, "Invalid $filter format. Expected format: 'ID eq <value>'");
    }

    const filterValue = filterParts[2].replace(/^'(.*)'$/, "$1");
    result = result.filter((queue) => queue.ID === filterValue);
  } else if (search) {
    const searchTerm = search.toLowerCase();
    result = result.filter((queue) => queue.ID.toLowerCase().includes(searchTerm));
    result = result.sort((a, b) => a.ID.localeCompare(b.ID));
  }

  if (orderby) {
    const [field, direction] = orderby.split(" ");
    if (field !== "ID") {
      return req.reject(400, "Invalid $orderby field. Only 'ID' is supported.");
    }
    result = result.sort((a, b) => {
      const comparison = a.ID.localeCompare(b.ID);
      return direction === "desc" ? -comparison : comparison;
    });
  }

  const skipNumber = parseInt(skip || "0", 10);
  const topNumber = parseInt(top || result.length, 10);
  result = result.slice(skipNumber, skipNumber + topNumber);

  if (count) {
    result.$count = result.length;
  }
  return result;
}
