const cds = require("@sap/cds");

const enhanceModel = require("./lib/enhance-csn");

const PRINT_ACTION = "@PDF.Printable.Action";
const QUEUE_ENTITY = "@PDF.Printable.QueueEntity";
const FILE_ENTITY = "@PDF.Printable.FileEntity";
const COPIES_ELEMENT = "copies";
const QUEUE_ELEMENT = "qnameID";
const FILE_ELEMENT = "fileElement";

const LOG = cds.log("print");

cds.on("loaded", enhanceModel);

cds.once("served", async () => {
  const printer = await cds.connect.to("PrintService");
  for (let srv of cds.services) {
    // Iterate over all entities in the service
    for (let entity of srv.entities) {
      if (entity[QUEUE_ENTITY]) {
        srv.prepend(() =>
          srv.on("READ", entity, async (req) => {
            req.target = printer.entities.Queues;
            req.query.SELECT.from.ref[0] = "PrintService.Queues";
            try {
              return await printer.run(req.query);
            } catch (error) {
              LOG.error(error);
              // Only return client errors to not show technical errors to the user
              if (error.code >= 400 && error.code < 500) {
                req.reject(error.code, error.message);
              } else {
                req.reject(500, "QUEUE_UNKNOWN_ERROR");
              }
            }
          }),
        );
        continue;
      }

      if (entity[FILE_ENTITY]) {
        srv.prepend(() =>
          srv.on("READ", entity, async (req) => {
            req.target = printer.entities.Files;
            req.query.SELECT.from.ref[0] = "PrintService.Files";
            try {
              return await printer.run(req.query);
            } catch (error) {
              LOG.error(error);
              // Only return client errors to not show technical errors to the user
              if (error.code >= 400 && error.code < 500) {
                req.reject(error.code, error.message);
              } else {
                req.reject(500, "FILE_UNKNOWN_ERROR");
              }
            }
          }),
        );
      }

      if (!entity.actions) continue;

      for (const action of entity.actions) {
        if (action[PRINT_ACTION]) {
          checkPrintParamsInEntity(entity);

          srv.on(action.name, entity, async (req) => {
            const numberOfCopies = req.data[COPIES_ELEMENT];
            const queueID = req.data[QUEUE_ELEMENT];

            const { fileNameAttribute, contentAttribute } = getPrintParamsAttribute(
              entity,
              req.data,
            );

            const object = await SELECT.one
              .from(req.subject)
              .columns([fileNameAttribute, contentAttribute]);

            if (!object)
              return req.reject({
                status: 404,
                message: "PRINT_OBJECT_NOT_FOUND",
                args: [cds.i18n.labels.for(req.target) ?? req.target.name],
              });
            if (!numberOfCopies)
              return req.reject({ status: 400, message: "PRINT_SPECIFY_COPIES" });
            if (!queueID) return req.reject({ status: 400, message: "PRINT_SPECIFY_QUEUE" });
            if (!object[contentAttribute])
              return req.reject({ status: 400, message: "PRINT_NO_CONTENT" });

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

              return req.notify({
                status: 200,
                message: "PRINT_JOB_SENT",
                args: [object[fileNameAttribute], queueID],
              });
            } catch (error) {
              LOG.error(error);
              // Only return client errors to not show technical errors to the user
              if (error.code >= 400 && error.code < 500) {
                req.reject(error.code, error.message);
              } else {
                req.reject(500, "PRINT_UNKNOWN_ERROR");
              }
            }
          });
        }
      }
    }
  }
});

function checkPrintParamsInEntity(entity) {
  const files = Object.values(entity.elements).filter((el) => el.type === "cds.LargeBinary");

  if (files.length === 0)
    return cds.error("No large binary content found in the entity for printing.");

  if (files.length === 1) return true;

  files.forEach((file) => {
    if (
      !file["@Core.ContentDisposition"]?.["="] &&
      !file["@Core.ContentDisposition.Filename"]?.["="]
    ) {
      return cds.error(
        `No file name provided. Please add @Core.ContentDisposition to the ${file.name}.`,
      );
    }
  });

  return true;
}

function getPrintParamsAttribute(entity, data) {
  let fileNameAttribute, contentAttribute;
  if (data[FILE_ELEMENT]) {
    contentAttribute = data[FILE_ELEMENT];
    fileNameAttribute =
      entity.elements[contentAttribute]["@Core.ContentDisposition"]?.["="] ??
      entity.elements[contentAttribute]["@Core.ContentDisposition.Filename"]?.["="];
  } else {
    const content = Object.values(entity.elements).find((el) => el.type === "cds.LargeBinary");
    contentAttribute = content.name;
    fileNameAttribute =
      content["@Core.ContentDisposition"]?.["="] ??
      content["@Core.ContentDisposition.Filename"]?.["="];
  }

  return {
    fileNameAttribute,
    contentAttribute,
  };
}
