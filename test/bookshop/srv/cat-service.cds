using {sap.capire.bookshop as my} from '../db/schema';

service CatalogService {

  @PDF.Printable
  entity Test {
    key ID       : Integer;

        @Core.MediaType         : 'application/pdf'
        @Core.ContentDisposition: fileName
        file     : LargeBinary;
        fileName : String @readonly;
  } actions {}

  /**
   * For displaying lists of Books
   */
  @readonly
  entity ListOfBooks      as
    projection on Books
    excluding {
      descr
    };

  /**
   * For display in details pages
   */
  @readonly
  @PDF.Printable
  entity Books            as
    projection on my.Books {
      *,
      author.name as author
    }
    excluding {
      createdBy,
      modifiedBy
    }
    actions {
      action printBookFileManualImpl(
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

      );
    };

  entity BooksWithOneFile as projection on my.BooksWithOneFile;

  @requires: 'authenticated-user'
  action submitOrder(book: Books:ID @mandatory,
                     quantity: Integer @mandatory
  ) returns {
    stock : Integer
  };

  event OrderedBook : {
    book     : Books:ID;
    quantity : Integer;
    buyer    : String
  };
}
