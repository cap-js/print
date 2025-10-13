
// filepath: /home/user/projects/local-print-incidents/print/srv/__tests__/service.test.js
/* eslint-disable no-undef */

jest.mock('@sap/cds', () => {
  const emitMock = jest.fn();
  class MockService {
    emit(...args) {
      emitMock(...args);
      return 'SUPER_RESULT';
    }
  }
  const logger = { warn: jest.fn() };
  logger._warn = true; // enable warn branch
  return {
    Service: MockService,
    log: jest.fn(() => logger),
    outboxed: true, // skip alternative export path
    _emitMock: emitMock,
    _logger: logger
  };
});

describe('PrintService (service.js)', () => {
  let PrintService;
  let cds;

  beforeEach(() => {
    jest.resetModules();
    cds = require('@sap/cds');
    PrintService = require('../../srv/service');
  });

  test('emit with no args logs warning and returns undefined', () => {
    const svc = new PrintService();
    const ret = svc.emit();
    expect(cds._logger.warn).toHaveBeenCalledWith('No object provided for print');
    expect(ret).toBeUndefined();
    expect(cds._emitMock).not.toHaveBeenCalled();
  });

    test('emit with request object containing event calls super.emit(requestOnly)', () => {
    const svc = new PrintService();
    const reqObj = { event: 'DoPrint', data: { id: 1 } };
    const ret = svc.emit(reqObj);
    expect(ret).toBe('SUPER_RESULT');
    expect(cds._emitMock).toHaveBeenCalledTimes(1);
    expect(cds._emitMock).toHaveBeenCalledWith(reqObj);
  });

  test('emit with (event, message) sets message.action and calls super.emit(event, message)', () => {
    const svc = new PrintService();
    const msg = { foo: 'bar' };
    const ret = svc.emit('MyAction', msg);
    expect(ret).toBe('SUPER_RESULT');
    expect(msg.action).toBe('MyAction');
    expect(cds._emitMock).toHaveBeenCalledWith('MyAction', msg);
  });

  test('emit with only message having ActionKey uses ActionKey as event (no message.action set)', () => {
    const svc = new PrintService();
    const msg = { ActionKey: 'AltAction', foo: 1 };
    const ret = svc.emit(msg);
    expect(ret).toBe('SUPER_RESULT');
    // message.action is NOT added per current implementation path
    expect(msg.action).toBeUndefined();
    expect(cds._emitMock).toHaveBeenCalledWith('AltAction', msg);
  });

  test('emit with only message lacking action fields defaults to "Default"', () => {
    const svc = new PrintService();
    const msg = { foo: 2 };
    const ret = svc.emit(msg);
    expect(ret).toBe('SUPER_RESULT');
    expect(msg.action).toBeUndefined(); // not set in this branch
    expect(cds._emitMock).toHaveBeenCalledWith('Default', msg);
  });

  test('print() is alias calling emit()', () => {
    const svc = new PrintService();
    const msg = { foo: 'x' };
    const spy = jest.spyOn(svc, 'emit');
    svc.print('AliasEvent', msg);
    expect(spy).toHaveBeenCalledWith('AliasEvent', msg);
  });
});