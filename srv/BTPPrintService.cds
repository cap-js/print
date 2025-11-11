@impl: './BTPPrintService.js'
@requires: 'authenticated-user'
service PrintService {
  
  @UI.HeaderInfo  : {
      TypeName : '{i18n>PRINT_QUEUE}',
      TypeNamePlural : '{i18n>PRINT_QUEUES}',
  }
  entity Queues {
    key ID          : String @Common.Label: '{i18n>ID}';
        description : String @Common.Label: '{i18n>DESCRIPTION}';
  }

  type PrintRequest {
    @title : '{i18n>PRINT_QUEUE}'
    qname          : String;
    @title : '{i18n>NUMBER_OF_COPIES}'
    numberOfCopies : Integer;
    docsToPrint    : many {
      isMainDocument : Boolean;
      fileName       : String;
      content        : String;
    }
  }

  type PrintResponse {
    taskId : String;
  }

  action print(request: PrintRequest) returns PrintResponse;
}
