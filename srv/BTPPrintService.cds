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
}
