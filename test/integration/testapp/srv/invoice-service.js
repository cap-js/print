const fs = require("node:fs");
var path = require("path");
const { exec } = require("child_process");
const os = require("os");

module.exports = class ProductService extends cds.ApplicationService {
  init() {
    // Wrap exec in a Promise to use it with async/await
    const execCommand = (command) => {
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(`Error executing command: ${error.message}`);
          } else if (stderr) {
            reject(`stderr: ${stderr}`);
          } else {
            resolve(stdout);
          }
        });
      });
    };

    this.on("noMainDocument", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.attachmentName = "Invoice_343_attachment.pdf";
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
      req.data.attachment = fs.readFileSync(path.join(__dirname, req.data.fileName));
      const queues = "test";
      req.data.qName_ID = queues[0];
      req.data.numberOfCopies = 2;
    });

    this.on("multipleMainDocument", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.documentName = "Invoice_343.pdf";
      req.data.documentName1 = "Invoice_343_attachment.pdf";
      req.data.attachmentName = "Invoice_343_attachment.pdf";
      req.data.fileName = "Invoice_343.pdf";
      req.data.document = fs.readFileSync(path.join(__dirname, req.data.documentName));
      req.data.document1 = fs.readFileSync(path.join(__dirname, req.data.documentName));
      req.data.attachment = fs.readFileSync(path.join(__dirname, req.data.documentName));
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.documentName));
      const queues = "test";
      req.data.qName_ID = queues[0];
      req.data.numberOfCopies = 2;
    });

    this.on("noFileContentField", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.documentName = "Invoice_343.pdf";
      req.data.documentName1 = "Invoice_343_attachment.pdf";
      req.data.attachmentName = "Invoice_343_attachment.pdf";
      req.data.fileName = "Invoice_343.pdf";
      req.data.document = fs.readFileSync(path.join(__dirname, req.data.documentName));
      req.data.document1 = fs.readFileSync(path.join(__dirname, req.data.documentName));
      req.data.attachment = fs.readFileSync(path.join(__dirname, req.data.documentName));
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.documentName));
      const queues = "test";
      req.data.qName_ID = queues[0];
      req.data.numberOfCopies = 2;
    });

    this.on("noQueueAnnotation", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
      const queues = "test";
      req.data.qName_ID = queues[0];
      req.data.numberOfCopies = 2;
    });

    this.on("queueNotFilled", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
      req.data.numberOfCopies = 2;
    });

    this.on("noCopiesAnnotation", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
      const queues = "test";
      req.data.qName1_ID = queues[0];
    });

    this.on("copiesNotFilled", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
      const queues = "test";
      req.data.qName1_ID = queues[0];
    });

    this.on("contentUsedInActionSuccess", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.documentName1 = "Invoice_343.pdf";
      req.data.document1 = fs.readFileSync(path.join(__dirname, req.data.documentName1));
      const queues = "test";
      req.data.qName_ID = queues[0];
      req.data.numberOfCopies = 2;
    });

    this.on("contentUsedInActionFail", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.documentName1 = "Invoice_343.pdf";
      req.data.document1 = fs.readFileSync(path.join(__dirname, req.data.documentName1));
      const queues = "test";
      req.data.qName_ID = queues[0];
      req.data.numberOfCopies = 2;
    });

    this.on("queueUsedInActionSucess", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
      const queues = "test";
      req.data.qName1_ID = queues[0];
      req.data.numberOfCopies1 = 2;
    });

    this.on("queueUsedInActionFail", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
      const queues = "test";
      req.data.qName1_ID = queues[0];
      req.data.numberOfCopies1 = 2;
    });

    this.on("copiesUsedInActionSuccess", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
      const queues = "test";
      req.data.qName1_ID = queues[0];
      req.data.numberOfCopies1 = 2;
    });

    this.on("copiesUsedInActionFail", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
      const queues = "test";
      req.data.qName1_ID = queues[0];
      req.data.numberOfCopies1 = 2;
    });

    this.on("fileNameFieldMissing", async (req) => {
      req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503";
      req.data.fileName = "Invoice_343.pdf";
      req.data.document2 = fs.readFileSync(path.join(__dirname, req.data.fileName));
      const queues = "test";
      req.data.qName_ID = queues[0];
      req.data.numberOfCopies = 2;
    });

    super.init();
  }
};
