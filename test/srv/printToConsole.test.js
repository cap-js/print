/* eslint-disable no-undef */
const BASE_DATE = 1700000000000;

jest.mock('@sap/cds', () => {
  const logFn = jest.fn(() => ({
    info: jest.fn()
  }));
  return {
    log: logFn
  };
});

jest.mock('../../srv/service', () => {
  return class MockService {
    async init() {
      return 'super-init';
    }
  };
});

describe('PrintToConsole', () => {
  let PrintToConsole;
  let logger;
  let cds;

  beforeAll(() => {
    // Freeze time
    jest.spyOn(Date, 'now').mockReturnValue(BASE_DATE);
  });

  afterAll(() => {
    Date.now.mockRestore();
  });

  beforeEach(() => {
    jest.resetModules();
    cds = require('@sap/cds');
    PrintToConsole = require('../../srv/printToConsole');
    logger = cds.log.mock.results[0].value; // Logger instance used in module
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('init() logs initialization and calls super.init()', async () => {
    const svc = new PrintToConsole();
    const result = await svc.init();

    expect(cds.log).toHaveBeenCalledTimes(1);
    expect(cds.log).toHaveBeenCalledWith('print');

    // First info call should be init message
    expect(logger.info).toHaveBeenCalledWith('Print service initialized for console mode');
    expect(result).toBe('super-init');
  });

  test('print() with single document logs and returns expected structure (string queue -> undefined ID in message)', async () => {
    const svc = new PrintToConsole();
    const content = 'Hello World';
    const base64 = Buffer.from(content, 'utf8').toString('base64');

    const printRequest = {
      qname: 'DEFAULT_PRINTER',
      numberOfCopies: 2,
      docsToPrint: [
        { fileName: 'hello.txt', content: content }
      ]
    };

    const logSpy = logger.info;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await svc.print(printRequest);

    // Ensure queue list was retrieved
    expect(result).toEqual({
      status: 'success',
      message: 'Print job sent to undefined for 2 copies', // current (buggy) behavior
      taskId: `console-task-${BASE_DATE}`,
      queueUsed: 'DEFAULT_PRINTER'
    });

    // Console printed decoded content
    expect(consoleSpy).toHaveBeenCalledWith(content);

    // Some representative logging assertions
    expect(logSpy).toHaveBeenCalledWith('Received print request:', JSON.stringify(printRequest));
    expect(logSpy).toHaveBeenCalledWith('Print job completed successfully!');
    expect(logSpy).toHaveBeenCalledWith('Sent to: DEFAULT_PRINTER');

    consoleSpy.mockRestore();
  });

  test('print() with multiple documents', async () => {
    const svc = new PrintToConsole();
    const docs = [
      { fileName: 'a.txt', content: 'Alpha' },
      { fileName: 'b.txt', content: 'Beta'}
    ];
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await svc.print({
      qname: 'HP_LASERJET_PRO',
      numberOfCopies: 1,
      docsToPrint: docs
    });

    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Alpha');
    expect(consoleSpy).toHaveBeenNthCalledWith(2, 'Beta');

    consoleSpy.mockRestore();
  });

  test('print() with no documents does not call console.log', async () => {
    const svc = new PrintToConsole();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const res = await svc.print({
      qname: 'OFFICE_PRINTER_01',
      numberOfCopies: 3,
      docsToPrint: []
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(res.queueUsed).toBe('OFFICE_PRINTER_01');

    consoleSpy.mockRestore();
  });

  test('print() without qname throws TypeError due to selectedQueue.ID access', async () => {
    const svc = new PrintToConsole();
    await expect(
      svc.print({ numberOfCopies: 1, docsToPrint: [] })
    ).rejects.toThrow(TypeError);
  });
});