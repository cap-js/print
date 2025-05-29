namespace my.invoices;

using {cuid} from '@sap/cds/common';

entity Invoice : cuid {
    InvoiceNumber   : String;
    fileName        : String;
    fileContent     : LargeBinary;
    qName           : Association to one Queues;
    qName1          : Association to one Queues;
    numberOfCopies  : Integer;
    numberOfCopies1 : Integer;
    numberOfCopies2 : Integer;
    attachment      : LargeBinary;
    attachmentName  : String;
    document        : LargeBinary;
    documentName    : String;
    document1       : LargeBinary;
    documentName1   : String;
    document2       : LargeBinary;
}

@cds.skip.peristance
entity Queues {
    key ID          : String;
        description : String;
}
