using {sap.capire.incidents as my} from '../db/schema';

service ProcessorService {
    @PDF.Printable
    entity Incidents as projection on my.Incidents
        actions {
            action printIncidentFileManualImpl(
                                               @Common: {
                                                   ValueListWithFixedValues,
                                                   ValueList: {
                                                       $Type         : 'Common.ValueListType',
                                                       CollectionPath: 'PrintServiceQueues',
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

}
