using {my.invoices as db} from '../db/schema';

@impl: './invoice-service.js'
service InvoiceService {
    entity Invoices       as projection on db.Invoice;
    entity Queues         as projection on db.Queues;

    entity Document       as
        projection on db.Invoice {
            ID,
            @print.fileContent: {
                fileNameField: 'attachmentName', usedInAction: ['multipleMainDocument', 'noMainDocument']
            }
            attachment,
            attachmentName,
            @print.fileContent: {
                fileNameField: 'fileName', usedInAction: [
                    'multipleMainDocument',
                    'noMainDocument'
                ]
            }
            fileContent,
            fileName,
            @print.queue      : {
                SourceEntity: 'Queues'
            }
            qName,
            @print.numberOfCopies
            numberOfCopies,

            @print.fileContent: {
                fileNameField: 'documentName', usedInAction: ['multipleMainDocument']
            }
            @print.MainDocument
            document,
            documentName,

            @print.fileContent: {
                fileNameField: 'documentName1', usedInAction: [
                    'multipleMainDocument',
                    'usedInActionSuccess'
                ]
            }
            @print.MainDocument
            document1,
            documentName1,

            @print.fileContent: {
                usedInAction: ['fileNameFieldMissing']
            }
            document2
        }
        actions {
            @print
            action noMainDocument();

            @print
            action multipleMainDocument();

            @print
            action noFileContentField();

            @print
            action contentUsedInActionSuccess();

            @print
            action contentUsedInActionFail();

            @print
            action fileNameFieldMissing();
        }

    action fetchQueues() returns array of String;

    entity QueueAndCopies as
        projection on db.Invoice {
            ID,
            @print.fileContent   : {
                fileNameField: 'fileName'
            }
            fileContent,
            fileName,
            qName,
            @print.numberOfCopies: {
                usedInAction: [
                    'noQueueAnnotation',
                    'queueNotFilled'
                ]
            }
            numberOfCopies,

            @print.queue         : {
                SourceEntity: 'Queues', usedInAction: [
                    'queueNotFilled',
                    'noCopiesAnnotation',
                    'copiesNotFilled',
                    'queueUsedInActionSucess',
                    'copiesUsedInActionSuccess',
                    'copiesUsedInActionFail'
                ]
            }
            qName1,

            @print.numberOfCopies: {
                usedInAction: [
                    'copiesNotFilled',
                    'copiesUsedInActionSuccess',
                    'queueUsedInActionFail',
                    'queueUsedInActionSucess'
                ]
            }
            numberOfCopies1,
            numberOfCopies2
        }
        actions {
            @print
            action noQueueAnnotation();

            @print
            action queueNotFilled();

            @print
            action noCopiesAnnotation();

            @print
            action copiesNotFilled();

            @print
            action queueUsedInActionSucess();

            @print
            action queueUsedInActionFail();

            @print
            action copiesUsedInActionSuccess();

            @print
            action copiesUsedInActionFail();
        }

}
