using {sap.capire.incidents as my} from '../db/schema';
using {PrintService.Queues as q} from '@cap-js/print/srv/BTPPrintService';


service ProcessorService {
    @PDF.Printable
    entity Incidents as projection on my.Incidents
        actions {
            action printIncidentFileManualImpl(
                                               @Common: {
                                                   ValueListWithFixedValues,
                                                   ValueList: {
                                                       $Type         : 'Common.ValueListType',
                                                       CollectionPath: 'Queues',
                                                       Parameters    : [{
                                                           $Type            : 'Common.ValueListParameterInOut',
                                                           LocalDataProperty: qnameID,
                                                           ValueListProperty: 'ID'
                                                       }]
                                                   },
                                                   Label    : 'Print Queues',
                                               }
                                               qnameID: String,
                                               @UI.ParameterDefaultValue: 1
                                               copies: Integer

            )
        }

    annotate my.Customers with @cds.autoexpose;

    entity Queues    as projection on q;
}
