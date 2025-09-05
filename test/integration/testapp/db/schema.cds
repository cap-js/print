namespace my.invoices;

using {cuid} from '@sap/cds/common';
using { sap.print.Queues } from '@cap-js/print';

entity Invoice : cuid {
    InvoiceNumber   : String;
    fileName        : String;
    fileContent     : LargeBinary;
    qName           : Association to one Queues;
    numberOfCopies  : Integer;
    attachment      : LargeBinary;
    attachmentName  : String;
}
