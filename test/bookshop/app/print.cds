using CatalogService as service from '../srv/cat-service';
using from './browse/fiori-service';

// UI annotations for the print functionality
annotate service.Books with @(UI.Identification: [{
  $Type  : 'UI.DataFieldForAction',
  Action : 'CatalogService.printBookFileManualImpl',
  Label  : '{i18n>BookManualImpl}',
  IconUrl: 'sap-icon://print'
}]);

// Create a field group for the file
annotate service.Books with @(UI.FieldGroup #PrintFileGroup: {
  $Type: 'UI.FieldGroupType',
  Data : [{
    $Type: 'UI.DataField',
    Value: fileName,
    Label: 'File Name'
  }]
});

// Add the file facet to existing facets
annotate service.Books with @(UI.Facets: [..., {
  $Type : 'UI.ReferenceFacet',
  ID    : 'PrintFileFacet',
  Label : 'File Attachment',
  Target: '@UI.FieldGroup#PrintFileGroup'
}]);
