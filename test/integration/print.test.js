const cds = require("@sap/cds");
const path = require("path");
const app = path.join(__dirname, "../bookshop/");
const { test, POST } = cds.test(app);

describe("Print action tests", () => {
  beforeEach(async () => {
    await test.data.reset();
  });

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

  it("should send a print request via bound action automatically added with multiple files and draft enabled", async () => {
    const bookId = 201;

    const response = await POST(
      `/odata/v4/admin/Books(ID=${bookId},IsActiveEntity=true)/AdminService.print`,
      {
        copies: 1,
        qnameID: "OFFICE_PRINTER_01",
        fileElement: "file",
      },
      { auth: { username: "alice" } },
    );
    expect(response.status).toBe(204);
  });
});
