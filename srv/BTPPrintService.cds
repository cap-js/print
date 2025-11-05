@impl: './BTPPrintService.js'
service PrintService {
  entity Queues {
    key ID          : String;
        description : String;
  }

  action print();
}
