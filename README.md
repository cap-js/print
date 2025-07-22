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

To integrate the print functionality in your application, simply annotate any action with `@print`. This annotation automatically manages the process of sending documents to the print queues, requiring no additional setup for handling print jobs.

### Required Fields

The following three fields should be annotated with the corresponding `@print` annotations:

1. **`@print.queue`**: Specifies the queue to which the document should be sent for printing.
2. **`@print.numberOfCopies`**: Defines the number of copies to be printed.
3. **`@print.fileContent`**: Provides the file content to be printed. You can also specify the file name using the `fileNameField` property.

#### Example

```cds
@print.fileContent: {
    fileNameField: '<Field Name>',
}
```

Multiple fields can be annotated with `@print.fileContent` to send several documents to the print queue in a single action.

### Main Document

To designate a specific document as the primary document for printing, annotate it with `@print.MainDocument`:

```cds
@print.MainDocument
invoiceContent,
```

This ensures the specified document is treated as the main document when multiple documents are involved.

## Print Queue Configuration

You can retrieve all available print queues from the Print Service Application for selection by defining a `Queues` entity with **skip persistency**. This setup will offer a value help for the print queues, allowing users to select from available options.

### Define the `Queues` Entity

Define an entity like `Product` and associate it with the `Queues` entity as shown below:

#### Example
```cds
entity Product {
    qName : Association to one Queues;
}

@cds.skip.persistence
entity Queues {
    key ID          : String;
        description : String;
}
```

#### Annotating with `@print.queue`

Once the `Queues` entity is defined, specify it in the `@print.queue` annotation like so:

```cds
@print.queue: {
    SourceEntity: 'Queues'
}
qName
```

### Parameterizing Print Queue in Actions

Alternatively, if the print queue is passed as a parameter in the action, you can annotate it directly within the action definition. This can be done as follows:

#### In Database Definition:

```cds
entity Product {
    qName : Association to one Queues;
}

@cds.skip.persistence
entity Queues {
    key ID          : String;
        description : String;
}
```

#### In Service Definition:

```cds
service MyService {
    @print
    action print(
        @print.queue: {
            SourceEntity: 'Queues'
        }
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
        qnameID: String
    );

    entity Queues as projection on db.Queues;
}
```

In this setup, the `qnameID` parameter will be used to dynamically select the print queue from the `Queues` entity. The `Common.ValueList` provides a drop-down selection for available queues during runtime.


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
