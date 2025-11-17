import React, { useState } from 'react';
import { TennisBallIcon } from './icons';

interface LoginModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // Simulating network delay for better UX
    setTimeout(() => {
        // TODO: Substitua a senha codificada por um método de autenticação seguro como o Firebase Auth para produção.
        if (password === 'adminb') {
            onSuccess();
        } else {
            setError('Senha inválida.');
        }
        setIsLoading(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm p-8 space-y-6 bg-slate-800 rounded-xl shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="text-center">
            <TennisBallIcon className="w-12 h-12 mx-auto text-cyan-400" />
            <h2 className="mt-4 text-3xl font-bold text-center text-white">
                Acesso do Administrador
            </h2>
            <p className="mt-2 text-sm text-center text-slate-400">
                Insira a senha de administrador para gerenciar.
            </p>
        </div>

        {error && <p className="text-sm text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}

        <form className="space-y-4" onSubmit={handleLogin}>
            <div>
                <label htmlFor="password" className="sr-only">Senha</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required
                    className="appearance-none relative block w-full px-3 py-2 border border-slate-600 bg-slate-700 placeholder-slate-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <div>
                <button type="submit" disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-150">
                {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
            </div>
        </form>
        
        <div className="text-center">
            <button onClick={onClose} className="text-sm text-slate-400 hover:text-white">
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};