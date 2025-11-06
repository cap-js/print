const cds = require("@sap/cds");
const path = require("path");
const app = path.join(__dirname, "../bookshop/");
const { test, GET, POST } = cds.test(app);

describe("Print plugin tests", () => {
  beforeEach(async () => {
    await test.data.reset();
  });

  describe("Printing process", () => {
    it("should send a print request via bound action automatically added", async () => {
      const bookId = 201;

      const response = await POST(
        `/odata/v4/catalog/Books(ID=${bookId})/CatalogService.print`,
        {
          copies: 1,
          qnameID: "OFFICE_PRINTER_01",
        },
      );
      expect(response.status).toBe(204);
    });

    it("should send a print request via bound action automatically added", async () => {
      const bookId = 201;

      const response = await POST(
        `/odata/v4/catalog/Books(ID=${bookId})/CatalogService.printBookFileManualImpl`,
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
        "odata/v4/catalog/PrintServiceQueues?$search=print&$select=ID&$orderby=ID",
      );

      const queueContained = data.value.some((queue) => queue.ID === "DEFAULT_PRINTER_1");

      expect(data.value.length).toBe(5);
      expect(queueContained).toBe(true);
      expect(status).toBe(200);
    });

    it("should get the print queues with $filter", async () => {
      const { status, data } = await GET(
        "odata/v4/catalog/PrintServiceQueues?$filter=ID eq 'OFFICE_PRINTER_02'&$select=ID",
      );

      expect(status).toBe(200);
      expect(data.value.length).toBe(1);
      expect(data.value[0].ID).toBe("OFFICE_PRINTER_02");
    });

    it("should get the print queues with $count", async () => {
      const { status, data } = await GET(
        "odata/v4/catalog/PrintServiceQueues?$count=true&$select=ID",
      );

      expect(data.value.length).toBe(8);
      expect(data["@odata.count"]).toBe(8);
      expect(status).toBe(200);
    });

    it("should get the available print queues with $top and $skip", async () => {
      const { status, data } = await GET(
        "odata/v4/catalog/PrintServiceQueues?$top=3&$skip=2&$select=ID&$orderby=ID",
      );

      expect(data.value.length).toBe(3);
      expect(data.value[0].ID).toBe("DEFAULT_PRINTER_2");
      expect(status).toBe(200);
    });

    it("should get the print queues with $orderby descending", async () => {
      const { status, data } = await GET(
        "odata/v4/catalog/PrintServiceQueues?$orderby=ID desc&$select=ID",
      );

      expect(data.value.length).toBe(8);
      expect(data.value[0].ID).toBe("XEROX_WORKCENTRE");
      expect(status).toBe(200);
    });
  });
  describe("UI", () => {
    let metadata;

    beforeAll(async () => {
      const response = await GET("/odata/v4/catalog/$metadata?$format=json");
      metadata = response.data;
    });

    it("should add the print action to the UI identification", async () => {
      metadata.CatalogService["$Annotations"]["CatalogService.Books"]["@UI.Identification"];
      const identificationArray =
        metadata.CatalogService["$Annotations"]["CatalogService.Books"][
          "@UI.Identification"
        ];
      const hasPrintAction = identificationArray.some(
        (item) =>
          item["@type"] ===
            "https://sap.github.io/odata-vocabularies/vocabularies/UI.xml#UI.DataFieldForAction" &&
          item.Action === "CatalogService.print" &&
          item.Label === "Print",
      );
      expect(hasPrintAction).toBe(true);
    });
  });
});
