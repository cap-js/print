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

1. Make sure your CDS model is modelled correctly
2. Annotate your CDS model with `@PDF.Printable`

### Assumptions of your model

- The attribute you want to print is of type `LargeBinary`
- This attribute has the annotation `@Core.ContentDisposition: fileName`, where `fileName` is the attribute that specifies the file name
- TODO: Your entity only has one `LargeBinary` attribute to print

### Annotations in CDS model

To use the print plugin, simply annotate your entity with `@PDF.Printable`:

```cds
@PDF.Printable
entity Incidents as projection on my.Incidents;
```

This annotation does the following things in the background:

- Adds an action `print` to the annotated entity.
- This action is added to the UI and a handler is generated to process the print request.
- An entity `PrintServiceQueues` is added to the service to provide available print queues in a value help.

## Manual usage

You can also use the print service to print documents manually, i.e. without the `@PDF.Printable` annotations and generated actions and handlers. For this, you can use the `cds.connect.to`-API of CAP to connect to the print service and invoke the `print` action manually.

```javascript
const printService = cds.connect.to("PrintService");

await printService.send("print", {
  qname: "Printer_Queue_Name",
  numberOfCopies: 1,
  docsToPrint: [
    {
      fileName: "file_name.pdf",
      content: "<base64-encoded-pdf-content>",
      isMainDocument: true,
    },
  ],
});

const queues = await printService.get("/Queues");
```

It is possible that for LargeBinaries, that you get from the database, the content is provided as a stream. In this case, the stream needs to be converted to base64 before passing it to the print service. For an example, have a look at the sample application in `test/incidents-app/`

## Local Development

When running the application locally, i.e. `cds watch`, the print service is mocked. This mock implementation prints the print job details to the console instead of sending it to the actual print service. It also provides a number of sample print queues for selection.

## Hybrid Testing

You can also run the application locally with a binding to the cloud print service with CAP profiles. For more information, see [Hybrid Testing](https://cap.cloud.sap/docs/advanced/hybrid-testing#hybrid-testing). You need an instance of the SAP Print Service.

### Local

As the `hybrid` profile of the plugin uses SAP HANA Cloud to execute integration tests in CI, a profile `local` is added that uses can be used to execute the application locally with a binding to the cloud print service.

```bash
# Once as setup
cd test/incidents-app
cds bind -2 <print-service-instance-name> -4 local
# Run the application (from the root)
npm run watch-sample:local

```

### CI

For CI, the hybrid integration tests are automatically run against a SAP Print Service instance and a SAP HANA Cloud instance created for testing purposes.

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/cap-js/print/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).

## Security / Disclosure

If you find any bug that may be a security problem, please follow our instructions at [in our security policy](https://github.com/cap-js/print/security/policy) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/cap-js/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2025 SAP SE or an SAP affiliate company and print contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/cap-js/print).
