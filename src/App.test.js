import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
//unit test: adding a button
import { render, fireEvent, screen } from '@testing-library/react';
import App from './App';

test('should trigger summary fetching when submit button is clicked', () => {
  render(<App />);
  
  // Simulate entering a URL
  const input = screen.getByPlaceholderText('Enter YouTube URL');
  fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=MS5UjNKw_1M' } });
  
  // Simulate clicking the submit button
  const submitButton = screen.getByText('Submit');
  fireEvent.click(submitButton);
  
  // Assert that the summary is displayed
  expect(screen.getByText(/Your summary will appear here/)).toBeInTheDocument();
});
//integeration test: Testing API Call
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ summary: 'Test Summary' }),
  })
);

test('fetches summary from API and displays it', async () => {
  render(<App />);
  
  const input = screen.getByPlaceholderText('Enter YouTube URL');
  fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=MS5UjNKw_1M' } });

  const submitButton = screen.getByText('Submit');
  fireEvent.click(submitButton);
  
  await waitFor(() => screen.getByText('Test Summary'));
  
  expect(screen.getByText('Test Summary')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith('http://localhost:5002/summary', expect.any(Object));
});
//Testing Form Inputs and Language Switch (UI Test)
test('should update language and input field', () => {
  render(<App />);
  
  const selectLang = screen.getByTestId('language-selector');
  fireEvent.change(selectLang, { target: { value: 'hi' } });

  // Assert that the text updates based on language selection
  expect(screen.getByText('यूट्यूब वीडियो सारांश')).toBeInTheDocument();
  
  // Simulate entering a URL
  const input = screen.getByPlaceholderText('Enter YouTube URL');
  fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=MS5UjNKw_1M' } });
  
  expect(input.value).toBe('https://www.youtube.com/watch?v=MS5UjNKw_1M');
});
//Snapshot Testing (UI Consistency)
import { render } from '@testing-library/react';
import App from './App';

test('renders correctly', () => {
  const { asFragment } = render(<App />);
  expect(asFragment()).toMatchSnapshot();
});

