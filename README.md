# Welcome to @print

## About this project

`@print` is a CDS plugin providing print service features, [SAP Print Service](https://api.sap.com/api/PRINTAPI/overview).


## Table of Contents

- [About this project](#about-this-project)
- [Requirements](#requirements)
- [Setup](#setup)

## Requirements

See [Getting Started](https://cap.cloud.sap/docs/get-started) on how to jumpstart your development and grow as you go with SAP Cloud Application Programming Model.

## Setup

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