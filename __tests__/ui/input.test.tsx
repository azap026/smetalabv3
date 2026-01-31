import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';
import { expect, test } from 'vitest';

test('Input component renders and accepts user input', async () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Hello, World!');
    expect(input).toHaveValue('Hello, World!');
});
