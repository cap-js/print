# Welcome to @cap-js/print

[![REUSE status](https://api.reuse.software/badge/github.com/cap-js/print)](https://api.reuse.software/info/github.com/cap-js/print)

## About this project

CDS plugin for SAP Print service (package `@cap-js/print`) is a CDS plugin providing print service features through integration with [SAP Print Service](https://api.sap.com/api/PRINTAPI/overview).

## Table of Contents

- [About this project](#about-this-project)
- [Requirements](#requirements)
- [Setup](#setup)

## Requirements and Setup

See [Getting Started](https://cap.cloud.sap/docs/get-started) on how to jumpstart your development and grow as you go with SAP Cloud Application Programming Model.

Usage of this plugin requires a valid subscription of the [SAP Print Service](https://help.sap.com/docs/SCP_PRINT_SERVICE).

## Usage

To use this plugin to print documents there are two main steps:

1. Add required annotations to your CDS model.
    a. Entity
    b. Action
2. Configure print queues to select from available options. (Optional, but recommended)

### Annotations in CDS model

#### Entity

First of all, the entity needs to be annotated to define the content and the name of the document to be printed.

```cds
entity Incidents : cuid {
  @print.fileContent
  file : LargeBinary @Core.MediaType: 'application/pdf';
  @print.fileName
  fileName : String;
}

```

- `@print.fileContent`: Annotates the field containing the document content to be printed.
- `@print.fileName`: Annotates the field containing the name of the document

#### Annotation of actions
Sending a print request works via bound actions annotated with `@print`. The parameter of the action are used to define the print job details.

```cds
service IncidentService {
    entity Incidents as projection on db.Incidents actions {

    @print
    action printIncidentFile(
          @Common: {
              ValueListWithFixedValues,
              ValueList: {
                  $Type: 'Common.ValueListType',
                  CollectionPath: 'Queues',
                  Parameters: [{
                      $Type: 'Common.ValueListParameterInOut',
                      LocalDataProperty: qnameID,
                      ValueListProperty: 'ID'
                  }]
              },
              Label: 'Print Queues',
          }
          @print.queue
          qnameID: String,
          @print.numberOfCopies
          @UI.ParameterDefaultValue : 1
          copies: Integer 
      );
    };
}
```

- `@print`: Annotates the action that triggers the print job.
- `@print.queue`: Annotates the parameter specifying the print queue. It is recommended to use a value help for this parameter to select from available print queues. See TOOD
- `@print.numberOfCopies`: Annotates the parameter specifying the number of copies to print

### Queues 
Every print request needs to specify a print queue it is send to. It is recommended to provide a value help for the print queue selection. To enbale this, define an entity as projection on the `Queues` entity provided by the print service. When this projection is in place, the plugin automatically provides the available print queues coming from the print service.

```cds
using {sap.print as sp} from '@cap-js/print';

service IncidentService {
    entity Queues as projection on sp.Queues;
}
```

## Local Development

When running the application locally, i.e. `cds watch`, the print service is mocked. This mock implementation prints the print job details to the console instead of sending it to the actual print service. It also provides a number of sample print queues for selection.

You can also run the application locally with a binding to the cloud print service with CAP profiles. For more information, see [Hybrid Testing](https://cap.cloud.sap/docs/advanced/hybrid-testing#hybrid-testing).

## Note

If you are running the application in a production way locally(E.g. adding VCAP_SERVICES in `default-env.json`), add the environmental variable `SUBSCRIBER_SUBDOMAIN_FOR_LOCAL_TESTING=<Your subscriber subdomain name>` in the `package.json` as shown below.

#### Example

```json
"scripts": {
    "start": "SUBSCRIBER_SUBDOMAIN_FOR_LOCAL_TESTING=sub01 cds-serve"
}
```

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/cap-js/print/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).

## Security / Disclosure

If you find any bug that may be a security problem, please follow our instructions at [in our security policy](https://github.com/cap-js/print/security/policy) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/cap-js/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2025 SAP SE or an SAP affiliate company and print contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/cap-js/print).
