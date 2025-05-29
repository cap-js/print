const { entity_invoice, entity_sales_order } = require('./mockdata');
const { getQueueValueHelpEntity, getFieldsHoldingPrintConfig, getAnnotatedParamsOfAction, getPrintConfigFromActionOrEntity } = require('../../lib/annotation-helper');

jest.mock('@sap/cds/lib/ql/cds-ql', () => ({
    SELECT: {
        from: jest.fn(),
    }
}));

const cds = require('@sap/cds');

describe('Test annotation-helper.getQueueValueHelpEntity', () => {
    test('should extract value help entity name correctly when annotations are present', () => {
        const result = getQueueValueHelpEntity(entity_invoice.elements);
        expect(result).toBe('Queues');
    });
});

describe('Test annotation-helper.getFieldsHoldingPrintConfig', () => {

    describe('Test actionSpecificConfigFields', () => {

        beforeAll(async () => {
            result = await getFieldsHoldingPrintConfig(entity_invoice);
        });

        afterAll(() => {
            result = null;
        });

        test('should extract right key field when annotations are present', () => {
            expect(result.has("Invoice")).toBe(true);
        });

        test('should extract empty contentFieldsWithFileName in genericConfigFields when annotations are not present', () => {
            expect(result.get("Invoice").genericConfigFields.contentFieldsWithFileName).toStrictEqual([]);
        });

        test('should extract correct contentFieldsWithFileName in actionSpecificConfigFields when annotations are present', () => {
            expect(result.get("Invoice").actionSpecificConfigFields.contentFieldsWithFileName).toStrictEqual([
                {
                    contentField: undefined,
                    fileNameField: "fileName",
                    isMainDocument: false,
                    usedInActions: [
                        "releaseInvoice",
                    ],
                },
                {
                    contentField: undefined,
                    fileNameField: "fileName",
                    isMainDocument: true,
                    usedInActions: [
                        "releaseInvoice",
                    ],
                },
            ]);
        });

        test('should extract correct numberOfCopiesField in actionSpecificConfigFields when annotations are present', () => {
            expect(result.get("Invoice").actionSpecificConfigFields.numberOfCopiesField).toStrictEqual({
                field: "numberOfCopies",
                usedInActions: [
                    "releaseInvoice",
                ],
            });
        });

        test('should extract correct qname in actionSpecificConfigFields when annotations are present', () => {
            expect(result.get("Invoice").actionSpecificConfigFields.qname).toStrictEqual({
                field: "qname",
                usedInActions: [
                    "releaseInvoice",
                ],
            });
        });
    });

    describe('Test genericConfigFields', () => {

        beforeAll(async () => {
            result = await getFieldsHoldingPrintConfig(entity_sales_order);
        });

        afterAll(() => {
            result = null;
        });

        test('should extract right key field when annotations are present', () => {
            expect(result.has("SalesOrder")).toBe(true);
        });

        test('should extract empty actionSpecificConfigFields when annotations are not present', () => {
            expect(result.get("SalesOrder").actionSpecificConfigFields).toStrictEqual({});
        });

        test('should extract correct contentFieldsWithFileName in genericConfigFields when annotations are present', () => {
            expect(result.get("SalesOrder").genericConfigFields.contentFieldsWithFileName).toStrictEqual([
                {
                  contentField: undefined,
                  fileNameField: "fileName",
                  isMainDocument: false,
                },
                {
                  contentField: undefined,
                  fileNameField: "fileName",
                  isMainDocument: true,
                },
              ]);
        });

        test('should extract correct numberOfCopiesField in genericConfigFields when annotations are present', () => {
            expect(result.get("SalesOrder").genericConfigFields.numberOfCopiesField).toStrictEqual("numberOfCopies");
        });

        test('should extract correct qNameField in genericConfigFields when annotations are present', () => {
            expect(result.get("SalesOrder").genericConfigFields.qNameField).toStrictEqual("qName");
        });
    });

});

describe('Test annotation-helper.getAnnotatedParamsOfAction', () => {

    describe('Test actionSpecificConfigFields', () => {

        beforeAll(async () => {
            result = await getAnnotatedParamsOfAction(entity_invoice.actions.releaseInvoice);
        });

        afterAll(() => {
            result = null;
        });

        test('should extract right key field when annotations are present', () => {
            expect(result.has("releaseInvoice")).toBe(true);
        });

        test('should extract correct contentFieldsWithFileName when annotations are present', () => {
            expect(result.get("releaseInvoice").contentFieldsWithFileName).toStrictEqual([
                {
                  contentField: undefined,
                  fileNameField: "fileName",
                  isMainDocument: false,
                },
                {
                    contentField: undefined,
                    fileNameField: "fileName",
                    isMainDocument: true,
                  },
              ]);
        });

        test('should extract correct numberOfCopiesField when annotations are present', () => {
            expect(result.get("releaseInvoice").numberOfCopiesField).toStrictEqual("numberOfCopies");
        });

        test('should extract correct qNameField when annotations are present', () => {
            expect(result.get("releaseInvoice").qNameField).toStrictEqual("qname");
        });
    });
});

describe('Test annotation-helper.getPrintConfigFromActionOrEntity', () => {
    let req;

    beforeEach(() => {
        req = {
            target: { name: 'InvoiceService.Invoice' },
            event: 'releaseInvoice',
            entity: 'InvoiceService.Invoice',
            params: [
                {
                  ID: "495b6c06-847a-4938-b6f1-e03ffacc8904",
                }
            ],
            data: {
                numberOfCopies: 1,
                qnameID: "InvoiceQueue",
                attachment: "Invoice_345",
                fileName: "Invoice_345.pdf",
            }
        };

        mockEntityDataOfAnnotatedFields = [{
            ID: "495b6c06-847a-4938-b6f1-e03ffacc8904",
            InvoiceNumber: "345",
            attachmentName: "Invoice_345.pdf",
            fileName: "Invoice_345.pdf",
            qName_ID: "InvoiceQueue",
            numberOfCopies: 1,
        }];
        mockAnnotatedActionParams = {
            qNameField: "qnameID",
            contentFieldsWithFileName: [
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: true,
                },
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: false
                },
            ],
            numberOfCopiesField: "numberOfCopies",
        };
        mockAnnotatedEntityFields = {
            contentFieldsWithFileName: [
            ]
        };
        SELECT.from.mockImplementation(param => {
            return { "where": async (x) => mockEntityDataOfAnnotatedFields }
        });
        Map.prototype.get = jest.fn((key) => { 
            if (key == 'InvoiceService.Invoice') { 
                return { "genericConfigFields": mockAnnotatedEntityFields };
            } else if (key == 'releaseInvoice') {
                return mockAnnotatedActionParams;
            } else {
                return null;
            }
        });
    });

    it('should return print configuration when all annotations are present', async () => {

        const result = await getPrintConfigFromActionOrEntity(req);

        expect(result).toEqual({
            qname: "InvoiceQueue",
            numberOfCopies: 1,
            docsToPrint: [
              {
                content: "Invoice_345",
                fileName: "Invoice_345.pdf",
                isMainDocument: true,
                },
                {
                    content: "Invoice_345",
                    fileName: "Invoice_345.pdf",
                    isMainDocument: false,
                },
            ],
          });
    });

    it('should throw error when @print.queue is annotated in entity field and action both places', async () => {
        mockAnnotatedEntityFields = {
            qNameField: "qnameID",
            contentFieldsWithFileName: [
            ]
        };

        await expect(getPrintConfigFromActionOrEntity(req)).rejects.toThrow('Maintain @print.queue annotation in either entity or action, not both');
    });

    it('should throw error when @print.queue is missing configured', async () => {
        mockAnnotatedActionParams = {
            contentFieldsWithFileName: [
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: false,
                },
            ],
            numberOfCopiesField: "numberOfCopies",
        };

        await expect(getPrintConfigFromActionOrEntity(req)).rejects.toThrow('Print Configuration missing; Check if @print.queue annotation is maintained or the annotated field is populated');
    });

    it('should throw error when @print.numberOfCopies is annotated in entity field and action both places', async () => {
        mockAnnotatedEntityFields = {
            numberOfCopiesField: "numberOfCopies",
            contentFieldsWithFileName: [
            ]
        };

        await expect(getPrintConfigFromActionOrEntity(req)).rejects.toThrow('Maintain @print.numberOfCopies annotation in either entity or action, not both');
    });

    it('should throw error when @print.numberOfCopies is missing configured', async () => {
        mockAnnotatedActionParams = {
            qNameField: "qnameID",
            contentFieldsWithFileName: [
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: false,
                },
            ]
        };

        await expect(getPrintConfigFromActionOrEntity(req)).rejects.toThrow('Print Configuration missing; Check if @print.numberOfCopies annotation is maintained or the annotated field is populated');
    });

    it('should throw error when file content and fileName fields are missing maintained', async () => {
        mockAnnotatedActionParams = {
            qNameField: "qnameID",
            contentFieldsWithFileName: [
                {
                    isMainDocument: false,
                },
            ],
            numberOfCopiesField: "numberOfCopies",
        };

        await expect(getPrintConfigFromActionOrEntity(req)).rejects.toThrow('Print Configuration missing; Check if file content and fileName fields are maintained');
    });

    it('should throw error when request data miss file content and fileName', async () => {
        req = {
            target: { name: 'InvoiceService.Invoice' },
            event: 'releaseInvoice',
            entity: 'InvoiceService.Invoice',
            params: [
                {
                  ID: "495b6c06-847a-4938-b6f1-e03ffacc8904",
                }
            ],
            data: {
                numberOfCopies: 1,
                qnameID: "InvoiceQueue"
            }
        };

        mockEntityDataOfAnnotatedFields = [{
            ID: "495b6c06-847a-4938-b6f1-e03ffacc8904",
            InvoiceNumber: "345",
            qName_ID: "InvoiceQueue",
            numberOfCopies: 1,
            attachmentName: null,
            fileName: null
        }];
        await expect(getPrintConfigFromActionOrEntity(req)).rejects.toThrow('Print Configuration missing; Check if file content and fileName fields are maintained');
    });

    it('should throw error when @print.fileContent annotation is missing configured', async () => {
        mockAnnotatedActionParams = {
            qNameField: "qnameID",
            numberOfCopiesField: "numberOfCopies",
        };
        mockAnnotatedEntityFields = {
        };

        await expect(getPrintConfigFromActionOrEntity(req)).rejects.toThrow('No content fields found to print. Check if @print.fileContent annotation is maintained');
    });

    it('should throw error when there is no maindocument for multiple file content', async () => {
        mockAnnotatedActionParams = {
            qNameField: "qnameID",
            contentFieldsWithFileName: [
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: false,
                },
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: false
                },
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: false
                }
            ],
            numberOfCopiesField: "numberOfCopies",
        };

        await expect(getPrintConfigFromActionOrEntity(req)).rejects.toThrow('At least one MainDocument annotation should be present');
    });

    it('should throw error when there is more than one maindocument for multiple file content', async () => {
        mockAnnotatedActionParams = {
            qNameField: "qnameID",
            contentFieldsWithFileName: [
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: true,
                },
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: true
                },
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: true
                }
            ],
            numberOfCopiesField: "numberOfCopies",
        };

        await expect(getPrintConfigFromActionOrEntity(req)).rejects.toThrow('Multiple MainDocument annotations found in the entity');
    });

    it('should return print configuration with main document tag if there is only one document and it is not main document', async () => {
        mockAnnotatedActionParams = {
            qNameField: "qnameID",
            contentFieldsWithFileName: [
                {
                    contentField: "attachment",
                    fileNameField: "fileName",
                    isMainDocument: false,
                }
            ],
            numberOfCopiesField: "numberOfCopies",
        };

        const result = await getPrintConfigFromActionOrEntity(req);

        expect(result).toEqual({
            qname: "InvoiceQueue",
            numberOfCopies: 1,
            docsToPrint: [
              {
                content: "Invoice_345",
                fileName: "Invoice_345.pdf",
                isMainDocument: true,
                }
            ],
          });
    });
});
