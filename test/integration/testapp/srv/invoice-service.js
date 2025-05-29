const fs = require('node:fs');
var path = require('path');
const { exec } = require('child_process');
const os = require('os');

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

        // Function to fetch Local Printers based on the OS
        const fetchLocalPrinters = async () => {
            const platform = os.platform();
            let command;
            if (platform === 'darwin') {
                // macOS
                command = `lpstat -p`;
            } else if (platform === 'win32') {
                // Windows
                command = `wmic printer get name`;
            } else {
                throw new Error('Unsupported operating system');
            }
            try {
                const result = await execCommand(command);
                return result;
            } catch (error) {
                return null;
            }
        };
        // Function to parse Printer Names based on the OS
        const parsePrinterNames = (printerNames) => {
            const platform = os.platform();
            let printers = [];

            if (platform === 'darwin') {
                // macOS: Extract printers starting with 'printer' and take the second word
                printers = printerNames
                    .split('\n')
                    .filter(line => line.startsWith('printer'))
                    .map(line => line.split(' ')[1]);
            } else if (platform === 'win32') {
                // Windows: Split by new lines, remove empty entries, and trim the names
                const printerArray = printerNames.split('\n')                // Split by new lines
                    .map(line => line.trim())                                // Trim any whitespace
                    .filter(line => line && !line.startsWith('Name'))        // Remove empty lines and header

                printers = printerArray.map(line => {
                    if (line.includes('global.corp.sap')) {
                        // Remove the server path and keep the last part
                        return line.replace(/\\\\.*?\\/, '');                // Remove everything up to the last backslash
                    }
                    return line;                                             // Return the line as is if no match
                }).filter(line => line);                                     // Remove any empty strings
            }

            return printers;
        };
        this.on('fetchQueues', async (req) => {
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            return queues;
        });

        this.on('noMainDocument', async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.attachmentName = "Invoice_343_attachment.pdf";
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
            req.data.attachment = fs.readFileSync(path.join(__dirname, req.data.fileName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName_ID = queues[0];
            req.data.numberOfCopies = 2;
        });

        this.on('multipleMainDocument', async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.documentName = "Invoice_343.pdf";
            req.data.documentName1 = "Invoice_343_attachment.pdf";
            req.data.attachmentName = "Invoice_343_attachment.pdf";
            req.data.fileName = "Invoice_343.pdf";
            req.data.document = fs.readFileSync(path.join(__dirname, req.data.documentName));
            req.data.document1 = fs.readFileSync(path.join(__dirname, req.data.documentName));
            req.data.attachment = fs.readFileSync(path.join(__dirname, req.data.documentName));
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.documentName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName_ID = queues[0];
            req.data.numberOfCopies = 2;
        });

        this.on('noFileContentField', async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.documentName = "Invoice_343.pdf";
            req.data.documentName1 = "Invoice_343_attachment.pdf";
            req.data.attachmentName = "Invoice_343_attachment.pdf";
            req.data.fileName = "Invoice_343.pdf";
            req.data.document = fs.readFileSync(path.join(__dirname, req.data.documentName));
            req.data.document1 = fs.readFileSync(path.join(__dirname, req.data.documentName));
            req.data.attachment = fs.readFileSync(path.join(__dirname, req.data.documentName));
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.documentName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName_ID = queues[0];
            req.data.numberOfCopies = 2;
        });

        this.on('noQueueAnnotation', async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName_ID = queues[0];
            req.data.numberOfCopies = 2;
        });

        this.on('queueNotFilled', async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
            req.data.numberOfCopies = 2;
        });

        this.on("noCopiesAnnotation", async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName1_ID = queues[0];
        });

        this.on("copiesNotFilled", async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName1_ID = queues[0];
        });

        this.on("contentUsedInActionSuccess", async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.documentName1 = "Invoice_343.pdf";
            req.data.document1 = fs.readFileSync(path.join(__dirname, req.data.documentName1));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName_ID = queues[0];
            req.data.numberOfCopies = 2;
        });

        this.on("contentUsedInActionFail", async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.documentName1 = "Invoice_343.pdf";
            req.data.document1 = fs.readFileSync(path.join(__dirname, req.data.documentName1));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName_ID = queues[0];
            req.data.numberOfCopies = 2;
        });

        this.on('queueUsedInActionSucess', async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName1_ID = queues[0];
            req.data.numberOfCopies1 = 2;
        });

        this.on('queueUsedInActionFail', async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName1_ID = queues[0];
            req.data.numberOfCopies1 = 2;
        });

        this.on('copiesUsedInActionSuccess', async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName1_ID = queues[0];
            req.data.numberOfCopies1 = 2;
        });

        this.on('copiesUsedInActionFail', async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.fileContent = fs.readFileSync(path.join(__dirname, req.data.fileName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName1_ID = queues[0];
            req.data.numberOfCopies1 = 2;
        });

        this.on("fileNameFieldMissing", async (req) => {
            req.data.ID = "d37ce60b-2b3b-448d-9c43-2d6526f28503"
            req.data.fileName = "Invoice_343.pdf";
            req.data.document2 = fs.readFileSync(path.join(__dirname, req.data.fileName));
            const printers = await fetchLocalPrinters();
            const queues =  parsePrinterNames(printers);
            req.data.qName_ID = queues[0];
            req.data.numberOfCopies = 2;
        })

        super.init();
    }
}
