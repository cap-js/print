const cds = require("@sap/cds");
const path = require("path");

process.env.CDS_ENV = "hybrid";
// process.env.cds_requires = JSON.stringify({
//   middlewares: true,
//   queue: {
//     model: "@sap/cds/srv/outbox",
//     maxAttempts: 20,
//     chunkSize: 10,
//     parallel: true,
//     storeLastError: true,
//     timeout: "1h",
//     legacyLocking: true,
//     ignoredContext: ["user", "http", "model", "timestamp", "_locale", "_features"],
//     kind: "persistent-queue",
//   },
//   auth: {
//     restrict_all_services: false,
//     kind: "mocked",
//     users: {
//       alice: {
//         tenant: "t1",
//         roles: ["admin"],
//       },
//       bob: {
//         tenant: "t1",
//         roles: ["cds.ExtensionDeveloper"],
//       },
//       carol: {
//         tenant: "t1",
//         roles: ["admin", "cds.ExtensionDeveloper"],
//       },
//       dave: {
//         tenant: "t1",
//         roles: ["admin"],
//         features: [],
//       },
//       erin: {
//         tenant: "t2",
//         roles: ["admin", "cds.ExtensionDeveloper"],
//       },
//       fred: {
//         tenant: "t2",
//         features: ["isbn"],
//       },
//       me: {
//         tenant: "t1",
//         features: ["*"],
//       },
//       yves: {
//         roles: ["internal-user"],
//       },
//       "*": true,
//     },
//     tenants: {
//       t1: {
//         features: ["isbn"],
//       },
//       t2: {
//         features: "*",
//       },
//     },
//   },
//   destinations: {
//     vcap: {
//       label: "destination",
//     },
//   },
//   print: {
//     impl: "@cap-js/print/lib/printToPrintService",
//     vcap: {
//       tag: "print",
//     },
//     outbox: true,
//     kind: "print-to-service",
//   },
//   "print-service": {
//     binding: {
//       type: "cf",
//       apiEndpoint: "https://api.cf.eu12.hana.ondemand.com",
//       org: "cdsruntime",
//       space: "playground-sirsimon",
//       instance: "print-service",
//       key: "print-sender",
//     },
//     vcap: {
//       name: "print-service",
//     },
//     credentials: {
//       endpoints: {
//         printServiceBackend: "https://api.eu12.print.services.sap/qm",
//       },
//       "sap.cloud.service": "com.sap.print.mpq",
//       saasregistryenabled: true,
//       uaa: {
//         tenantmode: "shared",
//         sburl: "https://internal-xsuaa.authentication.eu12.hana.ondemand.com",
//         subaccountid: "21dbaa9c-2f5d-4f63-be0e-a9d5afee1f5c",
//         "credential-type": "binding-secret",
//         clientid: "sb-35eb5ee6-d8c6-4f33-8296-fb4b92a8335a!b1295631|print-app!b2085",
//         xsappname: "35eb5ee6-d8c6-4f33-8296-fb4b92a8335a!b1295631|print-app!b2085",
//         clientsecret:
//           "63fddd9e-2992-4f73-9e59-73ddad1ddc17$zbE7W8CgCAwySt3o1vZ0Z7UGZXSStQaGHiDj2ZjSqfM=",
//         serviceInstanceId: "35eb5ee6-d8c6-4f33-8296-fb4b92a8335a",
//         url: "https://cdsmunich.authentication.eu12.hana.ondemand.com",
//         uaadomain: "authentication.eu12.hana.ondemand.com",
//         verificationkey:
//           "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzYfekVIK6SoDqh9OE/8x\njhLAz1xyV9nkm+fK0UJYyp+EO6NrzjMOrU1ZVU3RbM1aRscmH8G43nV59+6R6rzW\nLxTSLwCV7Ga9yODT6Q6bPyCXxCu9w4/N7IhF8g0Nll3LFq6F9UxHpBQ3dfYBA+eI\nUspLZAMAqBfBLTGqXw40rY37k3fjOvwarJeEfH7ZQmqPfOFI3Qx8icuG1vjHuQcp\nR77FGF5xpJJyvQRvgJ8mD45t7h1LR5x34jYSMptu9o06EnyXsKQCYZvEzvD36tlj\nFI1BkD4arNUz4RgcK4NpgLes6/wzxOo3R0MVR9asZNJuqUi4ZZ0WbTbamoRGueSy\n2QIDAQAB\n-----END PUBLIC KEY-----",
//         apiurl: "https://api.authentication.eu12.hana.ondemand.com",
//         identityzone: "cdsmunich",
//         identityzoneid: "21dbaa9c-2f5d-4f63-be0e-a9d5afee1f5c",
//         tenantid: "21dbaa9c-2f5d-4f63-be0e-a9d5afee1f5c",
//         zoneid: "21dbaa9c-2f5d-4f63-be0e-a9d5afee1f5c",
//       },
//       service_url: "https://api.eu12.print.services.sap",
//       "html5-apps-repo": {
//         app_host_id: "37b07925-5ca3-4ec7-865c-1dad3879a706",
//       },
//     },
//   },
// });

const app = path.join(__dirname, "../incidents-app");
const { test, GET, POST } = cds.test(app);

describe("Tests for printing - Prod", () => {
  beforeEach(async () => {
    await test.data.reset();
  });

  it("should send a print request via bound action", async () => {
    console.log(process.env.cds_requires);
    const incidentId = "3583f982-d7df-4aad-ab26-301d4a157cd7";

    const response = await POST(
      `/odata/v4/processor/Incidents(ID=${incidentId},IsActiveEntity=true)/ProcessorService.printIncidentFile`,
      {
        copies: 1,
        qnameID: "hello-marten",
      },
    );
    expect(response.status).toBe(204);
  });
});
