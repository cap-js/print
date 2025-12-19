using CatalogService as service from '../srv/cat-service';
using from './browse/fiori-service';
using from './browse-one-file/fiori-service';

// UI annotations for the print functionality
annotate service.Books with @(UI.Identification: [{
  $Type  : 'UI.DataFieldForAction',
  Action : 'CatalogService.printBookFileManualImpl',
  Label  : '{i18n>BookManualImpl}',
  IconUrl: 'sap-icon://print'
}, ]);

// Create a field group for the file
annotate service.Books with @(UI.FieldGroup #PrintFileGroup: {
  $Type: 'UI.FieldGroupType',
  Data : [
    {
      $Type: 'UI.DataField',
      Value: file,
    },
    {
      $Type: 'UI.DataField',
      Value: file2,
    }
  ]
});

// Add the file facet to existing facets
annotate service.Books with @(UI.Facets: [..., {
  $Type : 'UI.ReferenceFacet',
  ID    : 'PrintFileFacet',
  Label : 'File Attachment',
  Target: '@UI.FieldGroup#PrintFileGroup'
}]);

annotate service.BooksWithOneFile with @(UI.FieldGroup #PrintFileGroup: {
  $Type: 'UI.FieldGroupType',
  Data : [{
    $Type: 'UI.DataField',
    Value: file,
  }, ]
});

// Add the file facet to existing facets
annotate service.Books with @(UI.Facets: [..., {
  $Type : 'UI.ReferenceFacet',
  ID    : 'PrintFileFacet',
  Label : 'File Attachment',
  Target: '@UI.FieldGroup#PrintFileGroup'
}]);

// Add the file facet to existing facets
annotate service.BooksWithOneFile with @(UI.Facets: [..., {
  $Type : 'UI.ReferenceFacet',
  ID    : 'PrintFileFacet',
  Label : 'File Attachment',
  Target: '@UI.FieldGroup#PrintFileGroup'
}]);
