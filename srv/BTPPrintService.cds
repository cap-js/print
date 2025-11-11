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

  entity Files {
    key entity      : String;

        @Common.Text: label  @Common.TextArrangement: #TextOnly
    key property    : String;
        fileName    : String;
        label       : String;
        entityKey1  : String;
        entityKey2  : String;
        entityKey3  : String;
        entityKey4  : String;
        entityKey5  : String;
        entityKey6  : String;
        entityKey7  : String;
        entityKey8  : String;
        entityKey9  : String;
        entityKey10 : String;
  }
}
