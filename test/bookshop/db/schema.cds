using { Currency, managed, sap } from '@sap/cds/common';

namespace sap.capire.bookshop;

entity Books : managed, BooksWithOneFile {
  // Printing field2
  @Common.Label: '{i18n>Summary2} '
  @Core.MediaType: 'application/pdf'
  @Core.ContentDisposition: fileName2
  file2 : LargeBinary ;
  @Common.Label: '{i18n>Summary2} '
  fileName2 : String  @readonly;
}

entity BooksWithOneFile {
  key ID   : Integer;
  title    : localized String(111)  @mandatory;
  descr    : localized String(1111);
  author   : Association to Authors @mandatory;
  genre    : Association to Genres;
  stock    : Integer;
  price    : Decimal;
  currency : Currency;
  // Printing field
  @Common.Label: '{i18n>Summary} '
  @Core.MediaType: 'application/pdf'
  @Core.ContentDisposition: fileName
  file : LargeBinary ;
  @Common.Label: '{i18n>Summary} '
  fileName : String  @readonly;
}

entity Authors : managed {
  key ID       : Integer;
  name         : String(111) @mandatory;
  dateOfBirth  : Date;
  dateOfDeath  : Date;
  placeOfBirth : String;
  placeOfDeath : String;
  books        : Association to many Books
                   on books.author = $self;
}

/** Hierarchically organized Code List for Genres */
entity Genres : sap.common.CodeList {
  key ID       : Integer;
      parent   : Association to Genres;
      children : Composition of many Genres
                   on children.parent = $self;
}
