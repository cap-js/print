@impl: './BTPPrintService.js'
@requires: 'authenticated-user'
service PrintService {

  @UI.HeaderInfo: {
    TypeName: '{i18n>PRINT_QUEUE}',
    TypeNamePlural: '{i18n>PRINT_QUEUES}',
  }
  entity Queues {
    key ID          : String @Common.Label: '{i18n>ID}';
        description : String @Common.Label: '{i18n>DESCRIPTION}';
  }

  type PrintRequest {
    @title: '{i18n>PRINT_QUEUE}'
    qname          : String;

    @title: '{i18n>NUMBER_OF_COPIES}'
    numberOfCopies : Integer;

    @title: '{i18n>DOCUMENTS_TO_PRINT}'
    docsToPrint    : many {
      isMainDocument : Boolean;
      fileName       : String;
      content        : String;
    }
  }

  type PrintResponse {
    @title: '{i18n>TASK_ID}'
    taskId : String;
  }

  action print(request: PrintRequest) returns PrintResponse;

  @UI.HeaderInfo: {
    TypeName: '{i18n>PRINT_FILE}',
    TypeNamePlural: '{i18n>PRINT_FILES}',
  }
  @title: '{i18n>PRINT_FILES}'
  entity Files {
        @title: '{i18n>OBJECT}'
    key entity      : String;

        @Common.Text: label  @Common.TextArrangement: #TextOnly  @title: '{i18n>PROPERTY}'
    key property    : String;

        @title: '{i18n>FILE_NAME}'
        fileName    : String;

        @title: '{i18n>LABEL}'
        label       : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey1  : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey2  : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey3  : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey4  : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey5  : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey6  : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey7  : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey8  : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey9  : String;

        @title: '{i18n>OBJECT_KEY}'
        entityKey10 : String;
  }
}
