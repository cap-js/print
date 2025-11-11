@impl: './BTPPrintService.js'
@requires: 'authenticated-user'
service PrintService {
  entity Queues {
    key ID          : String;
        description : String;
  }

  type PrintRequest {
    qname          : String;
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
