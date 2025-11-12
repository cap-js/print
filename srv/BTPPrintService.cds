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
    @title : '{i18n>DOCUMENTS_TO_PRINT}'
    docsToPrint    : many {
      isMainDocument : Boolean;
      fileName       : String;
      content        : String;
    }
  }

  type PrintResponse {
    @title : '{i18n>TASK_ID}'
    taskId : String;
  }

  action print(request: PrintRequest) returns PrintResponse;

  entity Files {
    @title : '{i18n>ENTITY}'
    key entity      : String;

        @Common.Text: label  @Common.TextArrangement: #TextOnly @title: '{i18n>PROPERTY}'
    key property    : String;
        @title      : '{i18n>FILE_NAME}'
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
