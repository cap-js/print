const cds = require("@sap/cds");
const path = require("path");
const app = path.join(__dirname, "../bookshop/");
const { test, GET } = cds.test(app);

describe("Print entities tests", () => {
  beforeEach(async () => {
    await test.data.reset();
  });

  describe("Print files VH", () => {
    it("should provide a valid VH for print files", async () => {
      const response = await GET(
        "/odata/v4/catalog/PrintServiceFiles?$select=entity,entityKey1,fileName,label,property&$count=true&$orderby=label&$filter=entity eq 'CatalogService.Books' and entityKey1 eq '207'&$skip=0&$top=100",
      );

      expect(response.data).toBeDefined();
      expect(response.data["@odata.count"]).toBe(2);

      expect(response.data.value[0]).toMatchObject({
        entityName: "CatalogService.Books",
        property: "file",
        fileName: "Book_207_Summary.pdf",
        label: "Summaryyy",
      });

      expect(response.data.value[1]).toMatchObject({
        entityName: "CatalogService.Books",
        property: "file2",
        fileName: "Book_207_Summary2.pdf",
        label: "Summaryyy2",
      });

      expect(response.status).toBe(200);
    });

    it("should not return something when filter is not applicable", async () => {
      const response = await GET(
        "odata/v4/catalog/PrintServiceFiles?$filter=(property eq 'something' or label eq 'something') and entity eq 'CatalogService.Books' and entityKey1 eq '207' &$skip=0&$top=2",
      );

      expect(response.data).toBeDefined();
      expect(response.data.value.length).toBe(0);
      expect(response.status).toBe(200);
    });

    it("should return something when filter is applicable with or", async () => {
      const response = await GET(
        "odata/v4/catalog/PrintServiceFiles?$filter=(property eq 'file' or label eq 'something') and entity eq 'CatalogService.Books' and entityKey1 eq '207' &$skip=0&$top=2",
      );

      expect(response.data).toBeDefined();
      expect(response.data.value.length).toBe(1);
      expect(response.status).toBe(200);
    });

    it("should return something when filter is applicable with or other way round", async () => {
      const response = await GET(
        "odata/v4/catalog/PrintServiceFiles?$filter=(property eq 'something' or label eq 'Summaryyy') and entity eq 'CatalogService.Books' and entityKey1 eq '207' &$skip=0&$top=2",
      );

      expect(response.data).toBeDefined();
      expect(response.data.value.length).toBe(1);
      expect(response.status).toBe(200);
    });

    it("should return something when filter is applicable with and", async () => {
      const response = await GET(
        "odata/v4/catalog/PrintServiceFiles?$filter=(property eq 'file' and label eq 'Summaryyy') and entity eq 'CatalogService.Books' and entityKey1 eq '207' &$skip=0&$top=2",
      );

      expect(response.data).toBeDefined();
      expect(response.data.value.length).toBe(1);
      expect(response.status).toBe(200);
    });

    it("should return something when filter is deeply nested", async () => {
      const response = await GET(
        "odata/v4/catalog/PrintServiceFiles?$filter=((((property eq 'file') and (label eq 'Summaryyy')))) and entity eq 'CatalogService.Books' and entityKey1 eq '207' &$skip=0&$top=2",
      );

      expect(response.data).toBeDefined();
      expect(response.data.value.length).toBe(1);
      expect(response.status).toBe(200);
    });

    it("should return something when filter is even more deeply nested", async () => {
      const response = await GET(
        "odata/v4/catalog/PrintServiceFiles?$filter=((((property eq 'file') and (label eq 'nope')) or (label eq 'Summaryyy'))) and entity eq 'CatalogService.Books' and entityKey1 eq '207' &$skip=0&$top=2",
      );

      expect(response.data).toBeDefined();
      expect(response.data.value.length).toBe(1);
      expect(response.status).toBe(200);
    });

    it("should return data for $search query", async () => {
      const response = await GET(
        "odata/v4/catalog/PrintServiceFiles?$search=file&$select=entity,entityKey1,fileName,label,property&$count=true&$orderby=label&$filter=entity eq 'CatalogService.Books' and entityKey1 eq '207'&$skip=0&$top=100",
      );

      expect(response.data).toBeDefined();
      expect(response.data["@odata.count"]).toBe(2);

      expect(response.data.value[0]).toMatchObject({
        entityName: "CatalogService.Books",
        property: "file",
        fileName: "Book_207_Summary.pdf",
        label: "Summaryyy",
      });

      expect(response.data.value[1]).toMatchObject({
        entityName: "CatalogService.Books",
        property: "file2",
        fileName: "Book_207_Summary2.pdf",
        label: "Summaryyy2",
      });

      expect(response.status).toBe(200);
    });

    it("should provide a valid VH for print files for composite keys", async () => {
      const response = await GET(
        "/odata/v4/catalog/PrintServiceFiles?$select=entity,entityKey1,entityKey2,fileName,label,property&$count=true&$orderby=label&$filter=entity eq 'CatalogService.CompositeKeys' and entityKey1 eq '1' and entityKey2 eq '2' &$skip=0&$top=100",
      );

      expect(response.data).toBeDefined();
      expect(response.data["@odata.count"]).toBe(2);

      expect(response.data.value[0]).toMatchObject({
        entityName: "CatalogService.CompositeKeys",
        property: "file",
        fileName: "Book_Composite_Summary.pdf",
        label: "Summaryyy",
      });

      expect(response.data.value[1]).toMatchObject({
        entityName: "CatalogService.CompositeKeys",
        property: "file2",
        fileName: "Book_Composite_Summary_2.pdf",
        label: "Summaryyy2",
      });

      expect(response.status).toBe(200);
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
});
