const cds = require("@sap/cds");
const path = require("path");
const app = path.join(__dirname, "../incidents-app");
const { test, GET, POST } = cds.test(app);
jest.setTimeout(60 * 1000);

describe("Print plugin tests", () => {
  beforeEach(async () => {
    await test.data.reset();
  });

  describe("Printing process", () => {
    it("should send a print request via bound action", async () => {
      const incidentId = "3583f982-d7df-4aad-ab26-301d4a157cd7";

      const response = await POST(
        `/odata/v4/processor/Incidents(ID=${incidentId},IsActiveEntity=true)/ProcessorService.printIncidentFile`,
        {
          copies: 1,
          qnameID: "OFFICE_PRINTER_01",
        },
      );
      expect(response.status).toBe(204);
    });
  });
  describe("Print queues retrieval", () => {
    it("should get the print queues with $search", async () => {
      const { status, data } = await GET(
        "odata/v4/processor/Queues?$search=print&$select=ID&$orderby=ID",
      );

      const queueContained = data.value.some((queue) => queue.ID === "DEFAULT_PRINTER_1");

      expect(data.value.length).toBe(5);
      expect(queueContained).toBe(true);
      expect(status).toBe(200);
    });

    it("should get the print queues with $filter", async () => {
      const { status, data } = await GET(
        "odata/v4/processor/Queues?$filter=ID eq 'OFFICE_PRINTER_02'&$select=ID",
      );

      expect(status).toBe(200);
      expect(data.value.length).toBe(1);
      expect(data.value[0].ID).toBe("OFFICE_PRINTER_02");
    });

    it("should get the print queues with $count", async () => {
      const { status, data } = await GET("odata/v4/processor/Queues?$count=true&$select=ID");

      expect(data.value.length).toBe(10);
      expect(data["@odata.count"]).toBe(10);
      expect(status).toBe(200);
    });

    it("should get the available print queues with $top and $skip", async () => {
      const { status, data } = await GET(
        "odata/v4/processor/Queues?$top=3&$skip=2&$select=ID&$orderby=ID",
      );

      expect(data.value.length).toBe(3);
      expect(data.value[0].ID).toBe("DEFAULT_PRINTER_2");
      expect(status).toBe(200);
    });

    it("should get the print queues with $orderby descending", async () => {
      const { status, data } = await GET("odata/v4/processor/Queues?$orderby=ID desc&$select=ID");

      expect(data.value.length).toBe(10);
      expect(data.value[0].ID).toBe("XEROX_WORKCENTRE");
      expect(status).toBe(200);
    });
  });
});
