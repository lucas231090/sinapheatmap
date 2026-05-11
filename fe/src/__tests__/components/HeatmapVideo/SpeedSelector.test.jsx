/**
 * Testes unitários para o componente SpeedSelector
 * Verifica a funcionalidade de seleção de velocidade dos pontos
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpeedSelector from '@/components/HeatmapVideo/SpeedSelector';

describe('SpeedSelector', () => {
    const mockSetPointsSpeed = jest.fn();
    const defaultProps = {
        pointsSpeed: 10,
        setPointsSpeed: mockSetPointsSpeed,
        disabled: false
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Testes de renderização básica
     */
    describe('Basic Rendering', () => {
        test('renders correctly with default props', () => {
            render(<SpeedSelector {...defaultProps} />);
            
            expect(screen.getByText('Velocidade dos Pontos:')).toBeInTheDocument();
            expect(screen.getByRole('combobox')).toBeInTheDocument();
            expect(screen.getByDisplayValue('10 pontos/s (Normal)')).toBeInTheDocument();
        });

        test('displays current speed value correctly', () => {
            render(<SpeedSelector {...defaultProps} pointsSpeed={20} />);
            
            expect(screen.getByDisplayValue('20 pontos/s (Muito Rápido)')).toBeInTheDocument();
        });

        test('shows correct description for selected speed', () => {
            render(<SpeedSelector {...defaultProps} />);
            
            expect(screen.getByText('Velocidade padrão')).toBeInTheDocument();
        });
    });

    /**
     * Testes de interação
     */
    describe('User Interactions', () => {
        test('calls setPointsSpeed when speed is changed', () => {
            render(<SpeedSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            fireEvent.change(select, { target: { value: '20' } });
            
            expect(mockSetPointsSpeed).toHaveBeenCalledWith(20);
            expect(mockSetPointsSpeed).toHaveBeenCalledTimes(1);
        });

        test('correctly parses string values to integers', () => {
            render(<SpeedSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            fireEvent.change(select, { target: { value: '15' } });
            
            expect(mockSetPointsSpeed).toHaveBeenCalledWith(15);
            expect(typeof mockSetPointsSpeed.mock.calls[0][0]).toBe('number');
        });
    });

    /**
     * Testes de estado disabled
     */
    describe('Disabled State', () => {
        test('renders correctly when disabled', () => {
            render(<SpeedSelector {...defaultProps} disabled={true} />);
            
            const select = screen.getByRole('combobox');
            expect(select).toBeDisabled();
        });

        test('applies disabled styling when disabled', () => {
            render(<SpeedSelector {...defaultProps} disabled={true} />);
            
            const select = screen.getByRole('combobox');
            expect(select).toHaveClass('bg-gray-100', 'cursor-not-allowed');
        });

        test('does not change value when disabled', () => {
            render(<SpeedSelector {...defaultProps} disabled={true} />);
            
            const select = screen.getByRole('combobox');
            
            // Verifica se o elemento está realmente disabled
            expect(select).toBeDisabled();
            
            // Não devemos conseguir alterar o valor de um select disabled
            // mas vamos tentar forçar e verificar se a função não é chamada
            fireEvent.change(select, { target: { value: '20' } });
            
            // O callback não deve ser chamado quando o select está disabled
            expect(mockSetPointsSpeed).not.toHaveBeenCalled();
        });
    });

    /**
     * Testes de layout
     */
    describe('Layout and Structure', () => {
        test('container has correct spacing classes', () => {
            const { container } = render(<SpeedSelector {...defaultProps} />);
            
            const mainDiv = container.firstChild;
            expect(mainDiv).toHaveClass('space-y-3');
        });

        test('description text is present', () => {
            render(<SpeedSelector {...defaultProps} />);
            
            const description = screen.getByText('Velocidade padrão');
            expect(description).toBeInTheDocument();
        });

        test('tip text is present', () => {
            render(<SpeedSelector {...defaultProps} />);
            
            const tip = screen.getByText(/Velocidades menores permitem uma análise mais detalhada/);
            expect(tip).toBeInTheDocument();
        });
    });
});
