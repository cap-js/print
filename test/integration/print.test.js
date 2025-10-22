const cds = require("@sap/cds");
const path = require("path");
const app = path.join(__dirname, "../incidents-app");
const { test, GET, POST } = cds.test(app);

describe("Tests for printing - Prod", () => {
  beforeEach(async () => {
    await test.data.reset();
  });

  it("should send a print request via bound action", async () => {
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
