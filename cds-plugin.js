const cds = require("@sap/cds");

const enhanceModel = require("./lib/enhance-csn");

const PRINT_ACTION = "@PDF.Printable.Action";
const QUEUE_ENTITY = "@PDF.Printable.QueueEntity";
const COPIES_ELEMENT = "copies";
const QUEUE_ELEMENT = "qnameID";

cds.on("compile.for.runtime", (csn) => {
  enhanceModel(csn);
});
cds.on("compile.to.edmx", (csn) => {
  enhanceModel(csn);
});
cds.on("compile.to.dbx", (csn) => {
  enhanceModel(csn);
});

cds.once("served", async () => {
  const printer = await cds.connect.to("PrintService");
  for (let srv of cds.services) {
    // Iterate over all entities in the service
    for (let entity of srv.entities) {
      const queueEntities = [];
      if (entity[QUEUE_ENTITY]) {
        queueEntities.push(entity);
      }
      if (queueEntities.length > 0) {
        srv.prepend(() => {
          srv.on("READ", queueEntities, async (req) => {
            req.target = printer.entities.Queues;
            req.query.SELECT.from.ref[0] = "PrintService.Queues";
            return await printer.run(req.query);
          });
        });
      }

      if (!entity.actions) continue;

      for (const action of entity.actions) {
        if (action[PRINT_ACTION]) {
          const { fileNameAttribute, contentAttribute } = getPrintParamsAttributeFromEntity(entity);

          srv.on(action.name, entity, async (req) => {
            const numberOfCopies = req.data[COPIES_ELEMENT];
            const queueID = req.data[QUEUE_ELEMENT];

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
              await printer.send("print", {
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

function getPrintParamsAttributeFromEntity(entity) {
  const content = Object.values(entity.elements).find((el) => el.type === "cds.LargeBinary");
  const fileNameAttribute = content["@Core.ContentDisposition"]["="];

  if (!content) return cds.error("No large binary content found in the entity for printing.");
  if (!fileNameAttribute)
    return cds.error(
      "No file name provided. Please add @Core.ContentDisposition to the content element.",
    );

  return {
    fileNameAttribute,
    contentAttribute: content.name,
  };
}
