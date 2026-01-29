import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { describe, it, expect } from 'vitest';

describe('Button Component', () => {
    it('renders correctly with child text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('applies standard styles', () => {
        render(<Button className="custom-class">Test</Button>);
        const button = screen.getByText('Test');
        expect(button).toHaveClass('custom-class');
    });
});
