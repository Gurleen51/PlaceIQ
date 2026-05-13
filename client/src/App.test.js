import { render, screen } from '@testing-library/react';

// Mock localStorage before importing App
beforeEach(() => {
  Storage.prototype.getItem = jest.fn(() => null);
  Storage.prototype.setItem = jest.fn();
  Storage.prototype.clear  = jest.fn();
});

// Mock recharts to avoid SVG rendering issues in jsdom
jest.mock('recharts', () => {
  const React = require('react');
  const mock  = (name) => ({ children, ...rest }) =>
    React.createElement('div', { 'data-testid': name, ...rest }, children);
  return {
    BarChart:          mock('BarChart'),
    Bar:               mock('Bar'),
    XAxis:             mock('XAxis'),
    YAxis:             mock('YAxis'),
    Tooltip:           mock('Tooltip'),
    PieChart:          mock('PieChart'),
    Pie:               mock('Pie'),
    Cell:              mock('Cell'),
    Legend:            mock('Legend'),
    ResponsiveContainer: ({ children }) => React.createElement('div', {}, children),
    LabelList:         mock('LabelList'),
    CartesianGrid:     mock('CartesianGrid'),
  };
});

import App from './App';

test('renders the sidebar brand name', () => {
  render(<App />);
  expect(screen.getByText(/PlaceIQ/i)).toBeInTheDocument();
});

test('renders the topbar heading', () => {
  render(<App />);
  expect(screen.getByText(/Smart Placement Analytics/i)).toBeInTheDocument();
});

test('shows login and register links when not authenticated', () => {
  render(<App />);
  expect(screen.getByText(/Student Login/i)).toBeInTheDocument();
  expect(screen.getByText(/Register/i)).toBeInTheDocument();
});