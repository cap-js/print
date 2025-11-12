using {sap.capire.bookshop as my} from '../db/schema';

service CatalogService {

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

  @PDF.Printable
  entity BooksWithOneFile as
    projection on my.BooksWithOneFile {
      *,
      author.name as author

    };

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
