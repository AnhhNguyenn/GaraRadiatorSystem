import React from 'react';
import { render, screen } from '@testing-library/react';
import { RevenueChart } from '../revenue-chart';

// Mock Recharts components
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');

  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children, data }: { children: React.ReactNode, data: any[] }) => (
      <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Bar: ({ dataKey, name }: { dataKey: string, name: string }) => (
      <div data-testid={`bar-${dataKey}`} data-name={name} />
    ),
    XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid={`x-axis-${dataKey}`} />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
  };
});

describe('RevenueChart', () => {
  it('renders the chart wrapper component', () => {
    render(<RevenueChart />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('passes correct data to the BarChart', () => {
    render(<RevenueChart />);
    const barChart = screen.getByTestId('bar-chart');
    expect(barChart).toBeInTheDocument();

    // Parse the data passed to the mock BarChart
    const dataStr = barChart.getAttribute('data-chart-data');
    expect(dataStr).not.toBeNull();

    if (dataStr) {
      const data = JSON.parse(dataStr);
      expect(data).toHaveLength(7); // 7 days of the week

      // Check the first data point
      expect(data[0]).toMatchObject({
        name: 'T2',
        offline: 4000000,
        shopee: 2400000,
        tiktok: 2400000
      });
    }
  });

  it('renders the correct Bar components', () => {
    render(<RevenueChart />);

    const offlineBar = screen.getByTestId('bar-offline');
    expect(offlineBar).toBeInTheDocument();
    expect(offlineBar).toHaveAttribute('data-name', 'Cửa hàng');

    const shopeeBar = screen.getByTestId('bar-shopee');
    expect(shopeeBar).toBeInTheDocument();
    expect(shopeeBar).toHaveAttribute('data-name', 'Shopee');

    const tiktokBar = screen.getByTestId('bar-tiktok');
    expect(tiktokBar).toBeInTheDocument();
    expect(tiktokBar).toHaveAttribute('data-name', 'TikTok');
  });

  it('renders axes and grid', () => {
    render(<RevenueChart />);
    expect(screen.getByTestId('x-axis-name')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });
});
