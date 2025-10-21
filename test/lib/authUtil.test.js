const xsenv = require("@sap/xsenv");
const xssec = require("@sap/xssec");
const cds = require("@sap/cds");
const { decodeJwt } = require("@sap-cloud-sdk/connectivity");

jest.mock("@sap/xsenv");
jest.mock("@sap/xssec");
jest.mock("@sap/cds/lib/log/cds-log");

const mockLogger = { error: jest.fn(), info: jest.fn() };
cds.log.mockReturnValue(mockLogger);
const { getJwt, readVcapServices } = require("../../lib/authUtil");

jest.mock("@sap-cloud-sdk/connectivity", () => ({
  // decodeJwt: jest.fn(() => {
  //     const mockDecodedJwt = { exp: Math.floor(Date.now() / 1000) + 3600 };
  //     return mockDecodedJwt;
  // }),
  decodeJwt: jest.fn(),
}));

describe("test authUtil model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("test readVcapServices function", () => {
    let originalEnv;
    let mockLogger;
    beforeEach(() => {
      originalEnv = cds.env;
      mockLogger = { error: jest.fn(), info: jest.fn() };
      cds.log = jest.fn(() => mockLogger);
    });
    afterEach(() => {
      cds.env = originalEnv;
      jest.clearAllMocks();
    });

    it("should return service credentials when found", async () => {
      cds.env = { requires: { print: { credentials: { tag: "Print" } } } };
      const req = { error: jest.fn() };
      const result = await readVcapServices(req);
      expect(result).toEqual({ tag: "Print" });
      expect(req.error).not.toHaveBeenCalled();
    });

    it("should log an error and return undefined when service credentials are not found in production", async () => {
      cds.env = { requires: {} };
      process.env.NODE_ENV = "production";
      const req = { error: jest.fn() };
      const result = await readVcapServices(req);
      expect(result).toBeUndefined();
      expect(req.error).toHaveBeenCalledWith(500, "Print service not found");
    });
    it("should log error and return undefined in non-production when credentials missing", async () => {
      cds.env = { requires: {} };
      process.env.NODE_ENV = "development";
      const req = { error: jest.fn() };
      const result = await readVcapServices(req);
      expect(result).toBeUndefined();
      expect(req.error).not.toHaveBeenCalled();
    });
  });

  describe("test getJwt function", () => {
    it("should return a cached JWT if it is valid", async () => {
      const mockJwt = "mock.jwt.token";
      const mockDecodedJwt = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const mockReq = { error: jest.fn() };
      const mockSvc = { uaa: {} };
      const mockAuthInfo = { getSubdomain: jest.fn().mockReturnValue("test-subdomain") };
      Map.prototype.get = jest.fn().mockReturnValue(mockJwt);
      cds.context = { http: { req: { authInfo: mockAuthInfo } } };

      decodeJwt.mockReturnValue(mockDecodedJwt);

      const result = await getJwt(mockReq, mockSvc);

      expect(result).toBe(mockJwt);
      expect(mockReq.error).not.toHaveBeenCalled();

      Map.prototype.get.mockClear();
    });

    it("should request a new JWT if none exists", async () => {
      const mockJwt = "new.jwt.token";
      const mockDecodedJwt = {
        zid: "test-tenant",
        scope: ["scope1"],
        ext_attr: { zdn: "test-subdomain" },
      };
      const mockReq = { error: jest.fn() };
      const mockSvc = { uaa: {} };
      const mockAuthInfo = { getSubdomain: jest.fn().mockReturnValue("test-subdomain") };
      Map.prototype.get = jest.fn().mockReturnValue(undefined);

      cds.context = { http: { req: { authInfo: mockAuthInfo } } };
      xssec.requests.requestClientCredentialsToken.mockImplementation(
        (_, __, ___, ____, callback) => {
          callback(null, mockJwt);
        },
      );
      decodeJwt.mockReturnValue(mockDecodedJwt);

      const result = await getJwt(mockReq, mockSvc);

      expect(result).toBe(mockJwt);
      expect(xssec.requests.requestClientCredentialsToken).toHaveBeenCalled();
      expect(mockReq.error).not.toHaveBeenCalled();

      Map.prototype.get.mockClear();
    });

    it("should request a new JWT if existing one is expired", async () => {
      const mockOldJwt = "old.jwt.token";
      const mockNewJwt = "new.jwt.token";
      const mockDecodedJwt = {
        zid: "test-tenant",
        scope: ["scope1"],
        ext_attr: { zdn: "test-subdomain" },
        exp: Math.floor(Date.now() / 1000) - 3600000,
      };
      const mockReq = { error: jest.fn() };
      const mockSvc = { uaa: {} };
      const mockAuthInfo = { getSubdomain: jest.fn().mockReturnValue("test-subdomain") };
      Map.prototype.get = jest.fn().mockReturnValue(mockOldJwt);
      Map.prototype.delete = jest.fn();

      cds.context = { http: { req: { authInfo: mockAuthInfo } } };
      xssec.requests.requestClientCredentialsToken.mockImplementation(
        (_, __, ___, ____, callback) => {
          callback(null, mockNewJwt);
        },
      );
      decodeJwt.mockReturnValue(mockDecodedJwt);

      const result = await getJwt(mockReq, mockSvc);

      expect(result).toBe(mockNewJwt);
      expect(xssec.requests.requestClientCredentialsToken).toHaveBeenCalled();
      expect(mockReq.error).not.toHaveBeenCalled();
      expect(Map.prototype.delete).toHaveBeenCalledTimes(1);

      Map.prototype.get.mockClear();
      Map.prototype.delete.mockClear();
    });

    it("should return an error if subdomain is missing", async () => {
      const mockReq = { error: jest.fn() };
      const mockSvc = { uaa: {} };

      cds.context = { http: { req: { authInfo: null } } };

      const result = await getJwt(mockReq, mockSvc);

      expect(result).toBeUndefined();
      expect(mockReq.error).toHaveBeenCalledWith(500, "Failed to retrieve subscriber domain");
    });

    it("should return an error if JWT retrieval fails", async () => {
      const mockReq = { error: jest.fn() };
      const mockSvc = { uaa: {} };
      const mockAuthInfo = { getSubdomain: jest.fn().mockReturnValue("test-subdomain") };
      Map.prototype.get = jest.fn().mockReturnValue(undefined);

      cds.context = { http: { req: { authInfo: mockAuthInfo } } };
      xssec.requests.requestClientCredentialsToken.mockImplementation(
        (_, __, ___, ____, callback) => {
          callback(new Error("Token error"), null);
        },
      );

      const result = await getJwt(mockReq, mockSvc);

      expect(result).toBeUndefined();
      expect(mockReq.error).toHaveBeenCalledWith(500, "Error retrieving JWT for subdomain");
      Map.prototype.get.mockClear();
    });
  });
});
