import React from 'react';
import { render } from '@testing-library/react';
import { RevenueChart } from '../../../components/dashboard/revenue-chart';

// Mock recharts
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children, data }: any) => (
      <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Bar: (props: any) => <div data-testid={`bar-${props.dataKey}`} {...props} />,
    XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
    YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
    CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
    Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  };
});

describe('RevenueChart Component', () => {
  it('renders the chart components correctly', () => {
    const { getByTestId } = render(<RevenueChart />);

    expect(getByTestId('responsive-container')).toBeInTheDocument();
    expect(getByTestId('bar-chart')).toBeInTheDocument();
    expect(getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(getByTestId('x-axis')).toBeInTheDocument();
    expect(getByTestId('y-axis')).toBeInTheDocument();
    expect(getByTestId('tooltip')).toBeInTheDocument();

    // Check for the bars corresponding to the data keys
    expect(getByTestId('bar-offline')).toBeInTheDocument();
    expect(getByTestId('bar-shopee')).toBeInTheDocument();
    expect(getByTestId('bar-tiktok')).toBeInTheDocument();
  });

  it('passes the correct data to BarChart', () => {
    const { getByTestId } = render(<RevenueChart />);
    const barChart = getByTestId('bar-chart');

    const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');

    expect(chartData).toBeDefined();
    expect(chartData.length).toBeGreaterThan(0);
    // Spot check one of the data points
    expect(chartData[0]).toHaveProperty('name', 'T2');
    expect(chartData[0]).toHaveProperty('offline');
    expect(chartData[0]).toHaveProperty('shopee');
    expect(chartData[0]).toHaveProperty('tiktok');
  });
});
