import React from 'react';

/**
 * Componente para seleção da velocidade dos pontos do heatmap
 */
const SpeedSelector = ({ 
    pointsSpeed, 
    setPointsSpeed, 
    disabled = false 
}) => {
    const speedOptions = [
        { value: 1, label: '1 ponto/s (Muito Lento)', description: 'Para análise detalhada' },
        { value: 5, label: '5 pontos/s (Lento)', description: 'Visualização cuidadosa' },
        { value: 10, label: '10 pontos/s (Normal)', description: 'Velocidade padrão' },
        { value: 15, label: '15 pontos/s (Rápido)', description: 'Visualização dinâmica' },
        { value: 20, label: '20 pontos/s (Muito Rápido)', description: 'Para visão geral' },
        { value: 30, label: '30 pontos/s (Máximo)', description: 'Muito dinâmico' }
    ];

    const handleSpeedChange = (event) => {
        const newSpeed = parseInt(event.target.value, 10);
        setPointsSpeed(newSpeed);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                Velocidade dos Pontos:
            </label>
            
            <select
                value={pointsSpeed}
                onChange={handleSpeedChange}
                disabled={disabled}
                className={`
                    w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                `}
            >
                {speedOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            
            {/* Descrição da velocidade selecionada */}
            <div className="text-sm text-gray-600">
                {speedOptions.find(option => option.value === pointsSpeed)?.description}
            </div>
            
            {/* Informação adicional */}
            <div className="text-xs text-gray-500">
                <strong>Dica:</strong> Velocidades menores permitem uma análise mais detalhada, 
                enquanto velocidades maiores oferecem uma visão geral mais rápida do comportamento.
            </div>
        </div>
    );
};

export default SpeedSelector;
