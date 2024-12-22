import { render, screen, fireEvent } from '@testing-library/react';
import MultiChoiceQuestion from './MultiChoiceQuestion';
import { PredictProvider } from '../PredictProvider';

describe('MultiChoiceQuestion', () => {
  const mockQuestion = {
    id: 'test-question',
    type: 'multiple-choice',
    title: 'Test Question',
    options: [
      { id: 'option-1', text: 'Option 1' },
      { id: 'option-2', text: 'Option 2' },
      { id: 'option-3', text: 'Option 3' },
    ],
  };

  const defaultProps = {
    question: mockQuestion,
    predictions: {},
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    highlightResolveBy: false,
  };

  const renderWithProvider = (props = {}) => {
    return render(
      <PredictProvider>
        <MultiChoiceQuestion {...defaultProps} {...props} />
      </PredictProvider>
    );
  };

  it('automatically adjusts values to maintain 100 total', () => {
    const onChange = jest.fn();
    renderWithProvider({ onChange });

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } });
    fireEvent.change(inputs[1], { target: { value: '30' } });

    expect(onChange).toHaveBeenLastCalledWith({
      'option-1': 60,
      'option-2': 30,
      'option-3': 10,
    });
  });
});