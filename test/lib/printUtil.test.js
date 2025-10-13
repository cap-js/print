// const cds = require('@sap/cds');
// const { print, populateQueueValueHelp } = require('../../lib/printUtil');
// const { getJwt, readVcapServices } = require('../../lib/authUtil');
// const { getPrintConfigFromActionOrEntity } = require('../../lib/annotation-helper');
// const axios = require('axios');

// jest.mock('../../lib/authUtil', () => ({
//     getJwt: jest.fn(),
//     readVcapServices: jest.fn(),
// }));

// jest.mock('../../lib/annotation-helper', () => ({
//     getPrintConfigFromActionOrEntity: jest.fn(),
// }));

// jest.mock('axios');

// describe('test printUtil module', () => {
//     describe('test populateQueueValueHelp function', () => {
//         const mockReq = { error: jest.fn(), results: [] };

//         beforeEach(() => {
//             jest.clearAllMocks();
//         });

//         it('should populate queue value help with available printers', async () => {
//             const mockVcap = { service_url: 'https://mock-service-url' };
//             const mockJwt = 'mock.jwt.token';
//             const mockResponse = { data: [{ qname: 'Printer1' }, { qname: 'Printer2' }] };

//             readVcapServices.mockResolvedValue(mockVcap);
//             getJwt.mockResolvedValue(mockJwt);
//             axios.create.mockReturnValue({
//                 get: jest.fn().mockResolvedValue(mockResponse),
//             });

//             await populateQueueValueHelp(null, mockReq);

//             expect(readVcapServices).toHaveBeenCalled();
//             expect(getJwt).toHaveBeenCalledWith(mockReq, mockVcap);
//             console.log(mockReq.results);
//             expect(mockReq.results).toEqual(
//                 expect.arrayContaining([
//                     expect.objectContaining({ ID: 'Printer1' }),
//                     expect.objectContaining({ ID: 'Printer2' }),
//                 ])
//             );
//             expect(mockReq.results.$count).toBe(2);
//         });

//         it('should return an error if print service is not found', async () => {
//             readVcapServices.mockResolvedValue(null);

//             await populateQueueValueHelp(null, mockReq);

//             expect(mockReq.error).toHaveBeenCalledWith(500, 'Print service not found');
//         });

//         it('should return an error if JWT retrieval fails', async () => {
//             const mockVcap = { service_url: 'https://mock-service-url' };
//             const mockJwtResponse = { code: 500, message: 'Print service not found' };

//             readVcapServices.mockResolvedValue(mockVcap);
//             getJwt.mockResolvedValue(mockJwtResponse);

//             await populateQueueValueHelp(null, mockReq);

//             expect(mockReq.error).toHaveBeenCalledWith(500, 'Failed to retrieve token');
//         });
//     });

//     describe('print', () => {
//         const mockReq = { error: jest.fn(), info: jest.fn() };

//         beforeEach(() => {
//             jest.clearAllMocks();
//         });

//         it('should handle the print request successfully', async () => {
//             const mockVcap = { service_url: 'https://mock-service-url' };
//             const mockJwt = 'mock.jwt.token';
//             const mockDocsToPrint = [
//                 { content: 'doc1-content', fileName: 'doc1', isMainDocument: true },
//                 { content: 'doc2-content', fileName: 'doc2', isMainDocument: false },
//             ];
//             const mockPrintConfig = {
//                 qname: 'Printer1',
//                 numberOfCopies: 2,
//                 docsToPrint: mockDocsToPrint,
//             };
//             const mockDocumentResponse = { data: 'doc1-object-key' };
//             const mockPrintTaskResponse = {};

//             readVcapServices.mockResolvedValue(mockVcap);
//             getJwt.mockResolvedValue(mockJwt);
//             getPrintConfigFromActionOrEntity.mockResolvedValue(mockPrintConfig);
//             axios.create.mockReturnValue({
//                 post: jest.fn().mockResolvedValue(mockDocumentResponse),
//                 put: jest.fn().mockResolvedValue(mockPrintTaskResponse),
//             });

//             await print(null, mockReq);

//             expect(readVcapServices).toHaveBeenCalled();
//             expect(getJwt).toHaveBeenCalledWith(mockReq, mockVcap);
//             expect(getPrintConfigFromActionOrEntity).toHaveBeenCalledWith(mockReq);
//             expect(mockReq.info).toHaveBeenCalledWith(
//                 200,
//                 expect.stringContaining('Document sent to print queue Printer1')
//             );
//         });

//         it('should return an error if print service is not found', async () => {
//             readVcapServices.mockResolvedValue(null);

//             await print(null, mockReq);

//             expect(mockReq.error).toHaveBeenCalledWith(500, 'Print service not found');
//         });

//         it('should return an error if JWT retrieval fails', async () => {
//             const mockVcap = { service_url: 'https://mock-service-url' };
//             const mockJwtResponse = { code: 500, message: 'Print service not found' };

//             readVcapServices.mockResolvedValue(mockVcap);
//             getJwt.mockResolvedValue(mockJwtResponse);

//             await print(null, mockReq);

//             expect(mockReq.error).toHaveBeenCalledWith(500, 'Failed to retrieve token');
//         });

//         it('should return an error if document upload fails', async () => {
//             const mockVcap = { service_url: 'https://mock-service-url' };
//             const mockJwt = 'mock.jwt.token';
//             const mockDocsToPrint = [{ content: 'doc1-content', fileName: 'doc1', isMainDocument: true }];
//             const mockPrintConfig = {
//                 qname: 'Printer1',
//                 numberOfCopies: 2,
//                 docsToPrint: mockDocsToPrint,
//             };

//             readVcapServices.mockResolvedValue(mockVcap);
//             getJwt.mockResolvedValue(mockJwt);
//             getPrintConfigFromActionOrEntity.mockResolvedValue(mockPrintConfig);
//             axios.create.mockReturnValue({
//                 post: jest.fn().mockRejectedValue({ response: { data: { error: { message: 'Upload error' } } } }),
//             });

//             await print(null, mockReq);

//             expect(mockReq.error).toHaveBeenCalledWith('Upload error');
//         });

//         it('should return an error if document is empty', async () => {
//             const mockVcap = { service_url: 'https://mock-service-url' };
//             const mockJwt = 'mock.jwt.token';
//             const mockDocsToPrint = [{ content: null, fileName: 'doc1', isMainDocument: true }];
//             const mockPrintConfig = {
//                 qname: 'Printer1',
//                 numberOfCopies: 2,
//                 docsToPrint: mockDocsToPrint,
//             };
//             const mockDocumentResponse = { data: 'doc1-object-key' };
//             const mockPrintTaskResponse = {};

//             readVcapServices.mockResolvedValue(mockVcap);
//             getJwt.mockResolvedValue(mockJwt);
//             getPrintConfigFromActionOrEntity.mockResolvedValue(mockPrintConfig);
//             axios.create.mockReturnValue({
//                 post: jest.fn().mockResolvedValue(mockDocumentResponse),
//                 put: jest.fn().mockResolvedValue(mockPrintTaskResponse),
//             });

//             await print(null, mockReq);

//             expect(mockReq.error).toHaveBeenCalledWith('No content provided for printing');
//         });

//         it('should return an error if print task creation fails', async () => {
//             const mockVcap = { service_url: 'https://mock-service-url' };
//             const mockJwt = 'mock.jwt.token';
//             const mockDocsToPrint = [
//             { content: 'doc1-content', fileName: 'doc1', isMainDocument: true },
//             { content: 'doc2-content', fileName: 'doc2', isMainDocument: false },
//             ];
//             const mockPrintConfig = {
//             qname: 'Printer1',
//             numberOfCopies: 2,
//             docsToPrint: mockDocsToPrint,
//             };
//             const mockDocumentResponse = { data: 'doc1-object-key' };
        
//             readVcapServices.mockResolvedValue(mockVcap);
//             getJwt.mockResolvedValue(mockJwt);
//             getPrintConfigFromActionOrEntity.mockResolvedValue(mockPrintConfig);
//             axios.create.mockReturnValue({
//             post: jest.fn().mockResolvedValue(mockDocumentResponse),
//             put: jest.fn().mockRejectedValue({ response: { data: { error: { message: 'Print task error' } } } }),
//             });
        
//             await print(null, mockReq);
        
//             expect(mockReq.error).toHaveBeenCalledWith('Print task failed');
//         });
//     });

// });
/* eslint-disable no-undef */

jest.mock('@sap/cds', () => {
    return {
      log: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn()
      })),
      context: { user: { id: 'tester' } }
    };
  });
  
  jest.mock('../../lib/authUtil', () => ({
    readVcapServices: jest.fn(),
    getJwt: jest.fn()
  }));
  
  jest.mock('../../lib/annotation-helper', () => ({
    getPrintConfigFromActionOrEntity: jest.fn()
  }));
  
  jest.mock('axios', () => ({
    create: jest.fn()
  }));
  
  const { readVcapServices, getJwt } = require('../../lib/authUtil');
  const { getPrintConfigFromActionOrEntity } = require('../../lib/annotation-helper');
  const axios = require('axios');
  
  const { populateQueueValueHelp, print } = require('../../lib/printUtil');
  
  describe('printUtil', () => {
  
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe('populateQueueValueHelp', () => {
      const mockReq = {
        error: jest.fn()
      };
  
      it('returns mapped queues with $count', async () => {
        const vcap = { service_url: 'https://example' };
        const jwt = 'jwt.token';
        const apiGet = jest.fn().mockResolvedValue({
          data: [{ qname: 'Printer1' }, { qname: 'Printer2' }]
        });
  
        readVcapServices.mockResolvedValue(vcap);
        getJwt.mockResolvedValue(jwt);
        axios.create.mockReturnValue({ get: apiGet });
  
        const result = await populateQueueValueHelp(null, mockReq);
  
        expect(readVcapServices).toHaveBeenCalled(); // no req passed in current impl
        expect(getJwt).toHaveBeenCalledWith(mockReq, vcap);
        expect(apiGet).toHaveBeenCalledWith('/qm/api/v1/rest/queues');
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ ID: 'Printer1' }),
            expect.objectContaining({ ID: 'Printer2' })
          ])
        );
        expect(result.$count).toBe(2);
        expect(mockReq.error).not.toHaveBeenCalled();
      });
  
      it('errors when service not found', async () => {
        readVcapServices.mockResolvedValue(null);
  
        await populateQueueValueHelp(null, mockReq);
  
        expect(mockReq.error).toHaveBeenCalledWith(500, 'Print service not found');
      });
  
      it('errors when JWT retrieval fails', async () => {
        const vcap = { service_url: 'u' };
        readVcapServices.mockResolvedValue(vcap);
        getJwt.mockResolvedValue({ code: 500 });
  
        await populateQueueValueHelp(null, mockReq);
  
        expect(mockReq.error).toHaveBeenCalledWith(500, 'Failed to retrieve token');
      });
  
      it('errors when queue fetch fails', async () => {
        const vcap = { service_url: 'u' };
        readVcapServices.mockResolvedValue(vcap);
        getJwt.mockResolvedValue('jwt');
        const apiGet = jest.fn().mockRejectedValue(new Error('network'));
        axios.create.mockReturnValue({ get: apiGet });
  
        await populateQueueValueHelp(null, mockReq);
  
        expect(mockReq.error).toHaveBeenCalledWith(500, 'Failed to fetch queues');
      });
    });
  
    describe('print', () => {
      const makeReq = (over = {}) => ({
        error: jest.fn((codeOrMsg, maybeMsg) => {
            if (maybeMsg === undefined) {
                return { code: 500, message: codeOrMsg }; // only message passed
            }
                return { code: codeOrMsg, message: maybeMsg };
            }),
            event: 'PrintAction',
            user: { id: 'reqUser' },
            ...over
      });
  
      const setupApi = ({
        postImpl,
        putImpl
      }) => {
        axios.create.mockReturnValue({
          post: postImpl,
          put: putImpl
        });
      };
  
      it('prints using target-based config (success path)', async () => {
        const req = makeReq({
          target: { name: 'Entity.Action' }
        });
  
        const docs = [
          { content: 'data-1', fileName: 'doc1', isMainDocument: true },
          { content: 'data-2', fileName: 'doc2' }
        ];
  
        getPrintConfigFromActionOrEntity.mockResolvedValue({
          qname: 'QueueA',
          numberOfCopies: 3,
          docsToPrint: docs
        });
  
        readVcapServices.mockResolvedValue({ service_url: 'https://print-host' });
        getJwt.mockResolvedValue('jwt.token');
  
        const postMock = jest
          .fn()
          .mockResolvedValueOnce({ data: 'objKey1' })
          .mockResolvedValueOnce({ data: 'objKey2' });
  
        const putMock = jest.fn().mockResolvedValue({ data: { task: 'ok' } });
  
        setupApi({ postImpl: postMock, putImpl: putMock });
  
        const res = await print(null, req);
  
        expect(getPrintConfigFromActionOrEntity).toHaveBeenCalledWith(req);
        expect(postMock).toHaveBeenCalledTimes(2);
        expect(putMock).toHaveBeenCalledWith(
          '/qm/api/v1/rest/print-tasks/objKey1',
          expect.objectContaining({
            numberOfCopies: 3,
            qname: 'QueueA',
            printContents: expect.arrayContaining([
              expect.objectContaining({ objectKey: 'objKey1', documentName: 'doc1' }),
              expect.objectContaining({ objectKey: 'objKey2', documentName: 'doc2' })
            ])
          })
        );
        expect(res).toMatchObject({
          status: 'SUCCESS',
          queue: 'QueueA',
          numberOfCopies: 3,
          taskId: 'objKey1'
        });
      });
  
      it('prints using direct request config (no target)', async () => {
        
        const req = makeReq({
          qname: 'QDirect',
          numberOfCopies: 1,
          docsToPrint: [{ content: 'abc', fileName: 'docA', isMainDocument: true }]
        });
  
        readVcapServices.mockResolvedValue({ service_url: 'https://p' });
        getJwt.mockResolvedValue('jwt.token');
  
        const postMock = jest.fn().mockResolvedValue({ data: 'mainKey' });
        const putMock = jest.fn().mockResolvedValue({ data: {} });
  
        setupApi({ postImpl: postMock, putImpl: putMock });
  
        const res = await print(null, req);
  
        expect(getPrintConfigFromActionOrEntity).not.toHaveBeenCalled();
        expect(res.taskId).toBe('mainKey');
        expect(res.queue).toBe('QDirect');
      });
  
      it('returns error when service not found', async () => {
        const req = makeReq({
          qname: 'Q',
          numberOfCopies: 1,
          docsToPrint: []
        });
        readVcapServices.mockResolvedValue(null);
  
        const res = await print(null, req);
        console.log(res);
        expect(req.error).toHaveBeenCalledWith(500, 'Print service not found');
        expect(res).toEqual({ code: 500, message: 'Print service not found' });
      });
  
      it('returns error when token retrieval fails', async () => {
        const req = makeReq({
          qname: 'Q',
          numberOfCopies: 1,
          docsToPrint: []
        });
        readVcapServices.mockResolvedValue({ service_url: 'u' });
        getJwt.mockResolvedValue({ code: 500 });
  
        const res = await print(null, req);
  
        expect(req.error).toHaveBeenCalledWith(500, 'Failed to retrieve token');
        expect(res).toEqual({ code: 500, message: 'Failed to retrieve token' });
      });
  
      it('returns error when document has no content', async () => {
        const req = makeReq({
          qname: 'Q',
          numberOfCopies: 1,
          docsToPrint: [{ fileName: 'badDoc' }]
        });
  
        readVcapServices.mockResolvedValue({ service_url: 'u' });
        getJwt.mockResolvedValue('jwt');
  
        setupApi({ postImpl: jest.fn(), putImpl: jest.fn() });
  
        const res = await print(null, req);
  
        expect(req.error).toHaveBeenCalledWith('No content provided for printing');
        expect(res).toEqual({ code: 500, message: 'No content provided for printing' });
      });
  
      it('returns error when upload fails', async () => {
        const req = makeReq({
          qname: 'Q',
          numberOfCopies: 1,
          docsToPrint: [{ content: 'c1', fileName: 'doc1', isMainDocument: true }]
        });
  
        readVcapServices.mockResolvedValue({ service_url: 'u' });
        getJwt.mockResolvedValue('jwt');
  
        const postMock = jest.fn().mockRejectedValue({
          response: { data: { error: { message: 'Upload failed' } } }
        });
  
        setupApi({ postImpl: postMock, putImpl: jest.fn() });
  
        const res = await print(null, req);
  
        expect(req.error).toHaveBeenCalledWith('Upload failed');
        expect(res).toEqual({ code: 500, message: 'Upload failed' });
      });
  
      it('returns error when print task put fails', async () => {
        const req = makeReq({
          qname: 'Q',
          numberOfCopies: 1,
          docsToPrint: [{ content: 'c1', fileName: 'doc1', isMainDocument: true }]
        });
  
        readVcapServices.mockResolvedValue({ service_url: 'u' });
        getJwt.mockResolvedValue('jwt');
  
        const postMock = jest.fn().mockResolvedValue({ data: 'mainKey' });
        const putMock = jest.fn().mockRejectedValue({
          response: { data: { error: { message: 'Queue error' } } }
        });
  
        setupApi({ postImpl: postMock, putImpl: putMock });
  
        const res = await print(null, req);
  
        expect(req.error).toHaveBeenCalledWith('Print task failed');
        expect(res).toEqual({ code: 500, message: 'Print task failed' });
      });
  
      it('handles no main document (itemId empty string)', async () => {
        const req = makeReq({
          qname: 'Q',
          numberOfCopies: 2,
          docsToPrint: [{ content: 'ccc', fileName: 'docX' }]
        });
  
        readVcapServices.mockResolvedValue({ service_url: 'u' });
        getJwt.mockResolvedValue('jwt');
  
        const postMock = jest.fn().mockResolvedValue({ data: 'k1' });
        const putMock = jest.fn().mockResolvedValue({ data: {} });
  
        setupApi({ postImpl: postMock, putImpl: putMock });
  
        const res = await print(null, req);
  
        expect(res.taskId).toBe(''); // current behavior since no isMainDocument
      });
    });
  });