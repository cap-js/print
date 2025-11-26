# Welcome to @cap-js/print

[![REUSE status](https://api.reuse.software/badge/github.com/cap-js/print)](https://api.reuse.software/info/github.com/cap-js/print)

## About this project

The `@cap-js/print` package is a [CDS plugin](https://cap.cloud.sap/docs/node.js/cds-plugins#cds-plugin-packages) that provides print service features through integration with the [SAP Print Service](https://api.sap.com/api/PRINTAPI/overview).

## Table of Contents

## Requirements and Setup

Using this plugin requires a valid subscription of the [SAP Print Service](https://help.sap.com/docs/SCP_PRINT_SERVICE).

## Usage

To use this plugin to print documents, there are two main steps:

1. Ensure your model meets the requirements
2. Annotate your CDS model with `@PDF.Printable`

### Model Requirements

- The attribute(s) you want to print are of type `LargeBinary`
- Those attributes have the annotation `@Core.ContentDisposition: fileName`, where `fileName` is the attribute that specifies the file name or a hardcoded string with the file name

### Annotations in CDS model

To use the print plugin, annotate your entity with `@PDF.Printable`:

```cds
@PDF.Printable
entity Books as projection on my.Books;
```

This annotation does the following things in the background:

- Adds an action `print` to the annotated entity with the following parameters:
  - `Queue`: Name of the print queue to use.
  - `Copies`: Number of copies to print.
  - `File`: Only added if the entity has multiple `LargeBinary` attributes. Allows selecting which file should be printed. Ensure that the `LargeBinary` properties are annotated with `@Common.Label`.
- This action is added to the UI and a handler is generated to process the print request.
- An entity `PrintServiceQueues` is added to the service to provide available print queues in a value help.
- An entity `PrintServiceFiles` is added to the service to provide available files in a value help (only if multiple `LargeBinary` attributes exist).

## Manual Usage

You can also use the print service to print documents manually, i.e., without the `@PDF.Printable` annotations and generated actions and handlers.

Use cases for a manual approach could be:

- You want to print documents that are not part of your CDS model, i.e., files generated at runtime
- Your model does not meet the requirements for the automatic approach
- You want to print a file type other than PDF

For this, you can use the `cds.connect.to` API of CAP to connect to the print service and invoke the `print` action manually.

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

It is possible that for LargeBinaries retrieved from the database, the content is provided as a stream. In this case, the stream needs to be converted to base64 before passing it to the print service. For example, see the sample application in `test/bookshop/`

## Local Development

When running the application locally, the print service is mocked. This mock implementation prints the print job details to the console instead of sending them to the actual print service. It also provides a number of sample print queues for selection.

## Hybrid Testing

You can also run the application locally with a binding to the cloud print service with CAP profiles. For more information, see [Hybrid Testing](https://cap.cloud.sap/docs/advanced/hybrid-testing#hybrid-testing). You need an instance of the SAP Print Service.

### Local

As the `hybrid` profile of the plugin uses SAP HANA Cloud to execute integration tests in CI, a profile `local` is added that can be used to execute the application locally with a binding to the cloud print service.

```bash
# Once as setup
cd test/bookshop
cds bind -2 <print-service-instance-name> -4 local
# Run the application (from the root)
npm run watch-sample:local

```

### CI

For CI, the hybrid integration tests are automatically run against a SAP Print Service instance and a SAP HANA Cloud instance created for testing purposes.

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports, etc. via [GitHub issues](https://github.com/cap-js/print/issues). Contributions and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).

## Security / Disclosure

If you find a bug that may be a security problem, please follow the instructions [in our security policy](https://github.com/cap-js/print/security/policy) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/cap-js/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2025 SAP SE or an SAP affiliate company and print contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information, including third-party components and their licensing/copyright information, is available [via the REUSE tool](https://api.reuse.software/info/github.com/cap-js/print).
