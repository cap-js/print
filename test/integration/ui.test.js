const cds = require("@sap/cds");
const path = require("path");
const app = path.join(__dirname, "../bookshop/");
const { test, GET } = cds.test(app);

describe("UI metadata tests", () => {
  beforeEach(async () => {
    await test.data.reset();
  });

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
      (item) => item.Action === "CatalogService.print" && item.Label === "Print",
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
      annotations["CatalogService.print(CatalogService.BooksWithOneFile)"]["@PDF.Printable"].Action,
    ).toBe(true);

    expect(
      annotations["CatalogService.print(CatalogService.BooksWithOneFile)/copies"],
    ).toBeDefined();
    expect(
      annotations["CatalogService.print(CatalogService.BooksWithOneFile)/qnameID"],
    ).toBeDefined();
    expect(
      annotations["CatalogService.print(CatalogService.BooksWithOneFile)/qnameID"]["@Common.Label"],
    ).toBe("Print queue");
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
    expect(fileElementAnn["@Common.Label"]).toBe("Print file");
    expect(fileElementAnn["@Common.ValueListWithFixedValues"]).toBe(true);

    const valueList = fileElementAnn["@Common.ValueList"];
    expect(valueList).toBeDefined();
    expect(valueList.CollectionPath).toBe("PrintServiceFiles");
    expect(Array.isArray(valueList.Parameters)).toBe(true);
    expect(valueList.Parameters).toHaveLength(4);

    expect(valueList.Parameters[0]).toMatchObject({
      LocalDataProperty: "fileElement",
      ValueListProperty: "property",
    });

    expect(valueList.Parameters[1]).toMatchObject({
      ValueListProperty: "fileName",
    });

    expect(valueList.Parameters[2]).toMatchObject({
      LocalDataProperty: "in/ID",
      ValueListProperty: "entityKey1",
    });

    expect(valueList.Parameters[3]).toMatchObject({
      ValueListProperty: "entity",
      Constant: "CatalogService.ListOfBooks",
    });

    expect(fileElementAnn["@Common.Label"]).toBe("Print file");
    expect(annotations["CatalogService.print(CatalogService.ListOfBooks)/qnameID"]).toBeDefined();
    expect(
      annotations["CatalogService.print(CatalogService.ListOfBooks)/qnameID"]["@Common.Label"],
    ).toBe("Print queue");
  });
});
