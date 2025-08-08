import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '@/services/authService';

export const useSignup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const updateField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            await registerUser(formData.name, formData.email, formData.password);
            navigate('/login', {
                state: { message: 'Cadastro realizado com sucesso! Faça o login.' },
            });
        } catch (err) {
            setError('Erro ao registrar. Verifique seus dados e tente novamente.');
            console.error('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        formData,
        error,
        isLoading,
        updateField,
        handleSubmit
    };
};
