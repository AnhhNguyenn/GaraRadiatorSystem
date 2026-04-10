import { api } from '../../lib/apiClient';

describe('apiClient fetch error handling', () => {
  let globalFetch: jest.Mock;

  beforeEach(() => {
    globalFetch = jest.fn();
    global.fetch = globalFetch as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetch network errors', () => {
    it('should throw "Network Error: ..." when fetch rejects with a generic error', async () => {
      globalFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(api.products.list(1, 10)).rejects.toThrow('Network Error: Failed to fetch');
    });

    it('should throw "Request timed out..." when fetch rejects with an AbortError', async () => {
      const abortError = new Error('AbortError message');
      abortError.name = 'AbortError';
      globalFetch.mockRejectedValueOnce(abortError);

      await expect(api.products.list(1, 10)).rejects.toThrow('Request timed out. Vui lòng thử lại sau.');
    });
  });

  describe('HTTP error responses', () => {
    it('should dispatch auth_error_401 and reject with "Unauthorized" on 401 response', async () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

      globalFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(api.products.list(1, 10)).rejects.toThrow('Unauthorized');

      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
      const eventArg = dispatchEventSpy.mock.calls[0][0] as Event;
      expect(eventArg.type).toBe('auth_error_401');

      dispatchEventSpy.mockRestore();
    });

    it('should throw 403 specific error message on 403 response', async () => {
      globalFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(api.products.list(1, 10)).rejects.toThrow('Bạn không có quyền thực hiện hành động này (403).');
    });

    it('should throw 429 specific error message on 429 response', async () => {
      globalFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(api.products.list(1, 10)).rejects.toThrow('Hệ thống đang quá tải, vui lòng thử lại sau (429).');
    });

    it('should throw generic API error message for other non-ok status codes', async () => {
      globalFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(api.products.list(1, 10)).rejects.toThrow('API error (500): Internal Server Error');
    });
  });

  describe('Success responses', () => {
    it('should parse response as JSON if content-type is application/json', async () => {
      const mockData = { id: 1, name: 'Product 1' };
      globalFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          'content-type': 'application/json'
        }),
        json: jest.fn().mockResolvedValueOnce(mockData)
      });

      const result = await api.products.list(1, 10);
      expect(result).toEqual(mockData);
    });

    it('should parse response as text if content-type is not application/json', async () => {
      const mockText = 'Success OK';
      globalFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          'content-type': 'text/plain'
        }),
        text: jest.fn().mockResolvedValueOnce(mockText)
      });

      const result = await api.products.list(1, 10);
      expect(result).toBe(mockText);
    });
  });
});
