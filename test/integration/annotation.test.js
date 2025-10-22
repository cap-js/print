const cds = require("@sap/cds");
const testapp = require("path").resolve(__dirname, "./testapp");
const { POST } = cds.test("serve", "--port", 5004).in(testapp);
const axios = require("axios");
const { log } = require("console");

jest.setTimeout(5 * 60 * 1000);

const TEST_SERVER = "http://localhost:5004";
let url = "";

describe("Annotation Util tests", () => {
  test("0. Get all the print queues from the machine", async () => {
    const queues = await axios.post(`${TEST_SERVER}/odata/v4/invoice/fetchQueues`, {});
    expect(queues.status).toEqual(200);
  });
  test("1. If there is more than one content field annotated with fileContent, but no Main Document annotation, throw error", async () => {
    try {
      url = "/odata/v4/invoice/Document(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.noMainDocument`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEqual("500");
      expect(e.response.data.error.message).toEqual(
        "Atleast one MainDocument annotation should be present",
      );
    }
  });

  test("2. If there is more than one content field annotated with fileContent and multiple fields annotated with Main Document, throw error", async () => {
    try {
      url = "/odata/v4/invoice/Document(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.multipleMainDocument`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEqual("500");
      expect(e.response.data.error.message).toEqual(
        "Multiple MainDocument annotations found in the entity",
      );
    }
  });

  test("3. If there is no file Content annotation for print annotated action, throw error", async () => {
    try {
      url = "/odata/v4/invoice/Document(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.noFileContentField`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEqual("500");
      expect(e.response.data.error.message).toEqual(
        "No content fields found to print. Check if @print.fileContent annotation is maintained",
      );
    }
  });

  test("4. If there is no queue annotation, throw error", async () => {
    try {
      url = "/odata/v4/invoice/QueueAndCopies(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.noQueueAnnotation`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEequal("500");
      expect(e.response.data.error.message).toEequal(
        "Print Configuration missing; Check if @print.queue annotation is maintained or the annotated field is populated",
      );
    }
  });

  test("5. If queue field is not filled, throw error", async () => {
    try {
      url = "/odata/v4/invoice/QueueAndCopies(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.queueNotFilled`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEequal("500");
      expect(e.response.data.error.message).toEequal(
        "Print Configuration missing; Check if @print.queue annotation is maintained or the annotated field is populated",
      );
    }
  });

  test("6. If there is no numberOfCopies annotation, throw error", async () => {
    try {
      url = "/odata/v4/invoice/QueueAndCopies(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.noCopiesAnnotation`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEequal("500");
      expect(e.response.data.error.message).toEequal(
        "Print Configuration missing; Check if @print.numberOfCopies annotation is maintained or the annotated field is populated",
      );
    }
  });

  test("7. If numberOfCopies field is not filled, throw error", async () => {
    try {
      url = "/odata/v4/invoice/QueueAndCopies(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.copiesNotFilled`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEequal("500");
      expect(e.response.data.error.message).toEequal(
        "Print Configuration missing; Check if @print.numberOfCopies annotation is maintained or the annotated field is populated",
      );
    }
  });

  test("8. If fileContent field is used in a specific action, then it can not be considered as content for any other action", async () => {
    try {
      url = "/odata/v4/invoice/Document(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.contentUsedInActionSuccess`, {}); //Dev: to Documents folder; no exception => print success
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.contentUsedInActionFail`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEequal("500");
      expect(e.response.data.error.message).toEequal(
        "No content fields found to print. Check if @print.fileContent annotation is maintained",
      );
    }
  });

  test("9. If queue field is used in a specific action, then it can not be considered as queue for any other action", async () => {
    try {
      url = "/odata/v4/invoice/QueueAndCopies(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.queueUsedInActionSucess`, {}); //Dev: to Documents folder; no exception => print success
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.queueUsedInActionFail`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEequal("500");
      expect(e.response.data.error.message).toEequal(
        "Print Configuration missing; Check if @print.queue annotation is maintained or the annotated field is populated",
      );
    }
  });

  test("10. If numberOfCopies field is used in a specific action, then it can not be considered as numberOfCopies for any other action", async () => {
    try {
      url = "/odata/v4/invoice/QueueAndCopies(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.copiesUsedInActionSuccess`, {}); //Dev: to Documents folder; no exception => print success
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.copiesUsedInActionFail`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEequal("500");
      expect(e.response.data.error.message).toEequal(
        "Print Configuration missing; Check if @print.numberOfCopies annotation is maintained or the annotated field is populated",
      );
    }
  });

  test("11. With fileContent Annotation, fileNameField param is mandatory", async () => {
    try {
      url = "/odata/v4/invoice/Document(ID=495b6c06-847a-4938-b6f1-e03ffacc8904)";
      await axios.post(`${TEST_SERVER}${url}/InvoiceService.fileNameFieldMissing`, {});
    } catch (e) {
      expect(e.response.data.error.code).toEequal("500");
      expect(e.response.data.error.message).toEequal(
        "Print Configuration missing; Check if file content and fileName fields are maintained",
      );
    }
  });
});
