const cds = require('@sap/cds');
const { print, populateQueueValueHelp } = require('../../lib/printUtil');
const { getJwt, readVcapServices } = require('../../lib/authUtil');
const { getPrintConfigFromActionOrEntity } = require('../../lib/annotation-helper');
const axios = require('axios');

jest.mock('../../lib/authUtil', () => ({
    getJwt: jest.fn(),
    readVcapServices: jest.fn(),
}));

jest.mock('../../lib/annotation-helper', () => ({
    getPrintConfigFromActionOrEntity: jest.fn(),
}));

jest.mock('axios');

describe('test printUtil module', () => {
    describe('test populateQueueValueHelp function', () => {
        const mockReq = { error: jest.fn(), results: [] };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should populate queue value help with available printers', async () => {
            const mockVcap = { service_url: 'https://mock-service-url' };
            const mockJwt = 'mock.jwt.token';
            const mockResponse = { data: [{ qname: 'Printer1' }, { qname: 'Printer2' }] };

            readVcapServices.mockResolvedValue(mockVcap);
            getJwt.mockResolvedValue(mockJwt);
            axios.create.mockReturnValue({
                get: jest.fn().mockResolvedValue(mockResponse),
            });

            await populateQueueValueHelp(null, mockReq);

            expect(readVcapServices).toHaveBeenCalled();
            expect(getJwt).toHaveBeenCalledWith(mockReq, mockVcap);
            console.log(mockReq.results);
            expect(mockReq.results).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ ID: 'Printer1' }),
                    expect.objectContaining({ ID: 'Printer2' }),
                ])
            );
            expect(mockReq.results.$count).toBe(2);
        });

        it('should return an error if print service is not found', async () => {
            readVcapServices.mockResolvedValue(null);

            await populateQueueValueHelp(null, mockReq);

            expect(mockReq.error).toHaveBeenCalledWith(500, 'Print service not found');
        });

        it('should return an error if JWT retrieval fails', async () => {
            const mockVcap = { service_url: 'https://mock-service-url' };
            const mockJwtResponse = { code: 500, message: 'Print service not found' };

            readVcapServices.mockResolvedValue(mockVcap);
            getJwt.mockResolvedValue(mockJwtResponse);

            await populateQueueValueHelp(null, mockReq);

            expect(mockReq.error).toHaveBeenCalledWith(500, 'Failed to retrieve token');
        });
    });

    describe('print', () => {
        const mockReq = { error: jest.fn(), info: jest.fn() };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should handle the print request successfully', async () => {
            const mockVcap = { service_url: 'https://mock-service-url' };
            const mockJwt = 'mock.jwt.token';
            const mockDocsToPrint = [
                { content: 'doc1-content', fileName: 'doc1', isMainDocument: true },
                { content: 'doc2-content', fileName: 'doc2', isMainDocument: false },
            ];
            const mockPrintConfig = {
                qname: 'Printer1',
                numberOfCopies: 2,
                docsToPrint: mockDocsToPrint,
            };
            const mockDocumentResponse = { data: 'doc1-object-key' };
            const mockPrintTaskResponse = {};

            readVcapServices.mockResolvedValue(mockVcap);
            getJwt.mockResolvedValue(mockJwt);
            getPrintConfigFromActionOrEntity.mockResolvedValue(mockPrintConfig);
            axios.create.mockReturnValue({
                post: jest.fn().mockResolvedValue(mockDocumentResponse),
                put: jest.fn().mockResolvedValue(mockPrintTaskResponse),
            });

            await print(null, mockReq);

            expect(readVcapServices).toHaveBeenCalled();
            expect(getJwt).toHaveBeenCalledWith(mockReq, mockVcap);
            expect(getPrintConfigFromActionOrEntity).toHaveBeenCalledWith(mockReq);
            expect(mockReq.info).toHaveBeenCalledWith(
                200,
                expect.stringContaining('Document sent to print queue Printer1')
            );
        });

        it('should return an error if print service is not found', async () => {
            readVcapServices.mockResolvedValue(null);

            await print(null, mockReq);

            expect(mockReq.error).toHaveBeenCalledWith(500, 'Print service not found');
        });

        it('should return an error if JWT retrieval fails', async () => {
            const mockVcap = { service_url: 'https://mock-service-url' };
            const mockJwtResponse = { code: 500, message: 'Print service not found' };

            readVcapServices.mockResolvedValue(mockVcap);
            getJwt.mockResolvedValue(mockJwtResponse);

            await print(null, mockReq);

            expect(mockReq.error).toHaveBeenCalledWith(500, 'Failed to retrieve token');
        });

        it('should return an error if document upload fails', async () => {
            const mockVcap = { service_url: 'https://mock-service-url' };
            const mockJwt = 'mock.jwt.token';
            const mockDocsToPrint = [{ content: 'doc1-content', fileName: 'doc1', isMainDocument: true }];
            const mockPrintConfig = {
                qname: 'Printer1',
                numberOfCopies: 2,
                docsToPrint: mockDocsToPrint,
            };

            readVcapServices.mockResolvedValue(mockVcap);
            getJwt.mockResolvedValue(mockJwt);
            getPrintConfigFromActionOrEntity.mockResolvedValue(mockPrintConfig);
            axios.create.mockReturnValue({
                post: jest.fn().mockRejectedValue({ response: { data: { error: { message: 'Upload error' } } } }),
            });

            await print(null, mockReq);

            expect(mockReq.error).toHaveBeenCalledWith('Upload error');
        });

        it('should return an error if document is empty', async () => {
            const mockVcap = { service_url: 'https://mock-service-url' };
            const mockJwt = 'mock.jwt.token';
            const mockDocsToPrint = [{ content: null, fileName: 'doc1', isMainDocument: true }];
            const mockPrintConfig = {
                qname: 'Printer1',
                numberOfCopies: 2,
                docsToPrint: mockDocsToPrint,
            };
            const mockDocumentResponse = { data: 'doc1-object-key' };
            const mockPrintTaskResponse = {};

            readVcapServices.mockResolvedValue(mockVcap);
            getJwt.mockResolvedValue(mockJwt);
            getPrintConfigFromActionOrEntity.mockResolvedValue(mockPrintConfig);
            axios.create.mockReturnValue({
                post: jest.fn().mockResolvedValue(mockDocumentResponse),
                put: jest.fn().mockResolvedValue(mockPrintTaskResponse),
            });

            await print(null, mockReq);

            expect(mockReq.error).toHaveBeenCalledWith('No content provided for printing');
        });

        it('should return an error if print task creation fails', async () => {
            const mockVcap = { service_url: 'https://mock-service-url' };
            const mockJwt = 'mock.jwt.token';
            const mockDocsToPrint = [
            { content: 'doc1-content', fileName: 'doc1', isMainDocument: true },
            { content: 'doc2-content', fileName: 'doc2', isMainDocument: false },
            ];
            const mockPrintConfig = {
            qname: 'Printer1',
            numberOfCopies: 2,
            docsToPrint: mockDocsToPrint,
            };
            const mockDocumentResponse = { data: 'doc1-object-key' };
        
            readVcapServices.mockResolvedValue(mockVcap);
            getJwt.mockResolvedValue(mockJwt);
            getPrintConfigFromActionOrEntity.mockResolvedValue(mockPrintConfig);
            axios.create.mockReturnValue({
            post: jest.fn().mockResolvedValue(mockDocumentResponse),
            put: jest.fn().mockRejectedValue({ response: { data: { error: { message: 'Print task error' } } } }),
            });
        
            await print(null, mockReq);
        
            expect(mockReq.error).toHaveBeenCalledWith('Print task failed');
        });
    });

});
