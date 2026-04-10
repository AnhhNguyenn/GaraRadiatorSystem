import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../../app/login/page';
import toast from 'react-hot-toast';

// Setup fetch mock before each test
beforeEach(() => {
  global.fetch = jest.fn();
  jest.clearAllMocks();
});

describe('LoginPage Error Handling', () => {
  it('handles successful login', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('admin@yourgarage.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText('Truy cập hệ thống'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Đăng nhập hệ thống Gara thành công!', expect.any(Object));
    });
  });

  it('handles login fetch failure (network error)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network disconnected'));

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('admin@yourgarage.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText('Truy cập hệ thống'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Mất kết nối máy chủ. Vui lòng kiểm tra lại mạng hoặc liên hệ quản trị viên.', expect.any(Object));
    });
  });

  it('handles login API error response with JSON message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('admin@yourgarage.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByText('Truy cập hệ thống'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Từ chối truy cập: Invalid credentials', expect.any(Object));
    });
  });

  it('handles login API error response with plain text message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => { throw new Error('Not JSON'); },
      text: async () => 'Server error occurred',
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('admin@yourgarage.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByText('Truy cập hệ thống'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Từ chối truy cập: Server error occurred', expect.any(Object));
    });
  });
});
