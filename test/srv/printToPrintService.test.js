// filepath: /home/user/projects/local-print-incidents/print/srv/__tests__/printToPrintService.test.js
/* eslint-disable no-undef */

const FIXED_TIME = 1712345678901;

jest.mock('@sap/cds', () => {
  const logMock = jest.fn(() => ({ info: jest.fn() }));
  return { log: logMock };
});

const mockSuperInit = jest.fn(async () => 'super-init');
jest.mock('../../srv/service', () => {
  return class MockBaseService {
    async init() { return mockSuperInit(); }
  };
});

const mockPopulate = jest.fn();
const mockPrintUtilPrint = jest.fn();
jest.mock('../../lib/printUtil', () => ({
  populateQueueValueHelp: (...args) => mockPopulate(...args),
  print: (...args) => mockPrintUtilPrint(...args)
}));

describe('PrintToPrintService', () => {
  let PrintToPrintService;
  let cds;
  let logger;

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);
  });

  afterAll(() => {
    Date.now.mockRestore();
  });

  beforeEach(() => {
    jest.resetModules();
    cds = require('@sap/cds');
    PrintToPrintService = require('../../srv/printToPrintService');
    logger = cds.log.mock.results[0].value;
    mockPopulate.mockReset();
    mockPrintUtilPrint.mockReset();
    mockSuperInit.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('init() logs and calls super.init()', async () => {
    const svc = new PrintToPrintService();
    const res = await svc.init();

    expect(cds.log).toHaveBeenCalledTimes(1);
    expect(cds.log).toHaveBeenCalledWith('print');
    expect(logger.info).toHaveBeenCalledWith('Print service initialized for production mode');
    expect(mockSuperInit).toHaveBeenCalledTimes(1);
    expect(res).toBe('super-init');
  });

  test('getQueues() returns data from populateQueueValueHelp', async () => {
    const svc = new PrintToPrintService();
    const fakeReq = {};
    const queues = [{ ID: 'Q1' }, { ID: 'Q2' }];
    mockPopulate.mockResolvedValue(queues);

    const res = await svc.getQueues(fakeReq);
    expect(mockPopulate).toHaveBeenCalledWith(null, fakeReq);
    expect(res).toBe(queues);
  });

  test('getQueues() failure path returns req.error result', async () => {
    const svc = new PrintToPrintService();
    const reqErrorObj = { code: 500, message: 'Failed to fetch queues' };
    const fakeReq = {
      error: jest.fn(() => reqErrorObj)
    };
    mockPopulate.mockRejectedValue(new Error('boom'));

    const res = await svc.getQueues(fakeReq);
    expect(fakeReq.error).toHaveBeenCalledWith(500, 'Failed to fetch queues');
    expect(res).toBe(reqErrorObj);
  });

  test('print() successful call invokes util print and returns success object', async () => {
    const svc = new PrintToPrintService();
    const printRequest = {
      qname: 'PRN_MAIN',
      numberOfCopies: 3,
      docsToPrint: [{ fileName: 'doc.pdf', content: 'BASE64DATA' }]
    };
    const utilResult = { status: 'SUCCESS', queue: 'PRN_MAIN' };
    mockPrintUtilPrint.mockResolvedValue(utilResult);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await svc.print(printRequest);

    // logs (5 info calls for banner)
    expect(logger.info).toHaveBeenCalledTimes(5);
    expect(logger.info).toHaveBeenNthCalledWith(1, '===============================');
    expect(logger.info).toHaveBeenNthCalledWith(2, 'Queue: PRN_MAIN');
    expect(logger.info).toHaveBeenNthCalledWith(3, 'Copies: 3');
    expect(logger.info).toHaveBeenNthCalledWith(4, 'Documents: 1');
    expect(logger.info).toHaveBeenNthCalledWith(5, '===============================');

    expect(mockPrintUtilPrint).toHaveBeenCalledWith(null, printRequest);
    expect(consoleSpy).toHaveBeenCalledWith(utilResult);

    expect(result).toEqual({
      status: 'success',
      message: 'Print job sent to PRN_MAIN for 3 copies',
      taskId: `console-task-${FIXED_TIME}`
    });

    consoleSpy.mockRestore();
  });

  test('print() error in util print still returns success response (current behavior)', async () => {
    const svc = new PrintToPrintService();
    const err = new Error('util failure');
    mockPrintUtilPrint.mockRejectedValue(err);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const printRequest = { qname: 'PRN_FAIL', numberOfCopies: 2, docsToPrint: [] };
    const result = await svc.print(printRequest);

    // util error logged via console.log(err, 'Failed to create print tasks')
    expect(consoleSpy).toHaveBeenCalledWith(err, 'Failed to create print tasks');
    expect(result).toEqual({
      status: 'success',
      message: 'Print job sent to PRN_FAIL for 2 copies',
      taskId: `console-task-${FIXED_TIME}`
    });

    consoleSpy.mockRestore();
  });

  test('print() with undefined numberOfCopies and qname reflects undefined in message', async () => {
    const svc = new PrintToPrintService();
    mockPrintUtilPrint.mockResolvedValue({ status: 'SUCCESS' });
    const res = await svc.print({ docsToPrint: [] });

    expect(res.message).toBe('Print job sent to undefined for undefined copies');
  });
});