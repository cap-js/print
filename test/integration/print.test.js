const cds = require("@sap/cds");
const path = require("path");
const app = path.join(__dirname, "../bookshop/");
const { test, GET, POST } = cds.test(app);

describe("Print plugin tests", () => {
  beforeEach(async () => {
    await test.data.reset();
  });

  describe("Printing process", () => {
    it("should send a print request via bound action automatically added with multiple file", async () => {
      const bookId = 201;

      const response = await POST(`/odata/v4/catalog/Books(ID=${bookId})/CatalogService.print`, {
        copies: 1,
        qnameID: "OFFICE_PRINTER_01",
        fileElement: "file",
      });
      expect(response.status).toBe(204);
    });

    it("should send a print request via bound action automatically added with one file", async () => {
      const bookId = 201;

      const response = await POST(
        `/odata/v4/catalog/BooksWithOneFile(ID=${bookId})/CatalogService.print`,
        {
          copies: 1,
          qnameID: "OFFICE_PRINTER_01",
        },
      );
      expect(response.status).toBe(204);
    });

    it("should send a print request via bound action manually added", async () => {
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
        metadata.CatalogService["$Annotations"]["CatalogService.Books"]["@UI.Identification"];
      const hasPrintAction = identificationArray.some(
        (item) =>
          item["@type"] ===
            "https://sap.github.io/odata-vocabularies/vocabularies/UI.xml#UI.DataFieldForAction" &&
          item.Action === "CatalogService.print" &&
          item.Label === "Print",
      );
      expect(hasPrintAction).toBe(true);
    });

    it("should add the print action and parameters for BooksWithOneFile", async () => {
      const annotations = metadata.CatalogService["$Annotations"];

      expect(annotations["CatalogService.print(CatalogService.BooksWithOneFile)"]).toBeDefined();
      expect(
        annotations["CatalogService.print(CatalogService.BooksWithOneFile)"]["@PDF.Printable"],
      ).toBeDefined();
      expect(
        annotations["CatalogService.print(CatalogService.BooksWithOneFile)"]["@PDF.Printable"]
          .Action,
      ).toBe(true);

      expect(
        annotations["CatalogService.print(CatalogService.BooksWithOneFile)/copies"],
      ).toBeDefined();
      expect(
        annotations["CatalogService.print(CatalogService.BooksWithOneFile)/qnameID"],
      ).toBeDefined();
      expect(
        annotations["CatalogService.print(CatalogService.BooksWithOneFile)/qnameID"][
          "@Common.Label"
        ],
      ).toBe("Print Queue");
    });

    it("should add the print action and parameters for ListOfBooks (multiple files)", async () => {
      const annotations = metadata.CatalogService["$Annotations"];

      expect(annotations["CatalogService.print(CatalogService.ListOfBooks)"]).toBeDefined();
      expect(
        annotations["CatalogService.print(CatalogService.ListOfBooks)"]["@PDF.Printable"],
      ).toBeDefined();
      expect(
        annotations["CatalogService.print(CatalogService.ListOfBooks)"]["@PDF.Printable"].Action,
      ).toBe(true);

      expect(annotations["CatalogService.print(CatalogService.ListOfBooks)/copies"]).toBeDefined();
      // Check Value Help params for fileElement
      const fileElementAnn =
        annotations["CatalogService.print(CatalogService.ListOfBooks)/fileElement"];
      expect(fileElementAnn["@Common.FieldControl"]).toBe("Mandatory");
      expect(fileElementAnn["@Common.Label"]).toBe("Print File");
      expect(fileElementAnn["@Common.ValueListWithFixedValues"]).toBe(true);

      const valueList = fileElementAnn["@Common.ValueList"];
      expect(valueList).toBeDefined();
      expect(valueList["@type"]).toBe(
        "https://sap.github.io/odata-vocabularies/vocabularies/Common.xml#Common.ValueListType",
      );
      expect(valueList.CollectionPath).toBe("PrintServiceFiles");
      expect(Array.isArray(valueList.Parameters)).toBe(true);
      expect(valueList.Parameters).toHaveLength(4);

      expect(valueList.Parameters[0]).toMatchObject({
        "@type":
          "https://sap.github.io/odata-vocabularies/vocabularies/Common.xml#Common.ValueListParameterInOut",
        LocalDataProperty: "fileElement",
        ValueListProperty: "property",
      });

      expect(valueList.Parameters[1]).toMatchObject({
        "@type":
          "https://sap.github.io/odata-vocabularies/vocabularies/Common.xml#Common.ValueListParameterDisplayOnly",
        ValueListProperty: "fileName",
      });

      expect(valueList.Parameters[2]).toMatchObject({
        "@type":
          "https://sap.github.io/odata-vocabularies/vocabularies/Common.xml#Common.ValueListParameterIn",
        LocalDataProperty: "in/ID",
        ValueListProperty: "entityKey1",
      });

      expect(valueList.Parameters[3]).toMatchObject({
        "@type":
          "https://sap.github.io/odata-vocabularies/vocabularies/Common.xml#Common.ValueListParameterConstant",
        ValueListProperty: "entity",
        Constant: "CatalogService.ListOfBooks",
      });

      expect(fileElementAnn["@Common.Label"]).toBe("Print File");
      expect(annotations["CatalogService.print(CatalogService.ListOfBooks)/qnameID"]).toBeDefined();
      expect(
        annotations["CatalogService.print(CatalogService.ListOfBooks)/qnameID"]["@Common.Label"],
      ).toBe("Print Queue");
    });
  });
});
