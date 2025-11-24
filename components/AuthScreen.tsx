
import React, { useState } from 'react';
import { auth, provider } from '../firebase/config';
import { LoaderCircle, Mail, Key, User as UserIcon } from 'lucide-react';

const AuthScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            if (isLogin) {
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                if (userCredential.user) {
                    await userCredential.user.updateProfile({ displayName: displayName });
                }
            }
        } catch (err: any) {
            console.error("Authentication Error:", err);
            setError(getFriendlyErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            await auth.signInWithPopup(provider);
        } catch (err: any) {
             console.error("Google Sign-In Error:", err);
             setError(getFriendlyErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };
    
    const getFriendlyErrorMessage = (code: string) => {
        switch (code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
            case 'auth/invalid-login-credentials':
                return 'E-mail ou senha inválidos.';
            case 'auth/email-already-in-use':
                return 'Este e-mail já está cadastrado.';
            case 'auth/weak-password':
                return 'A senha precisa ter pelo menos 6 caracteres.';
            case 'auth/invalid-email':
                return 'Por favor, insira um e-mail válido.';
            case 'auth/network-request-failed':
                return 'Erro de conexão. Verifique sua internet.';
            case 'auth/invalid-api-key':
                return 'Erro de configuração. Verifique as credenciais do Firebase.';
            default:
                return 'Ocorreu um erro. Tente novamente.';
        }
    };

    return (
        <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                     <img 
                      src="/professor-nutri.png" 
                      alt="Professor Nutri Mascot" 
                      className="h-16 w-16 rounded-full object-cover border-4 border-brand-surface shadow-lg mx-auto mb-4"
                  />
                    <h1 className="text-2xl font-bold text-brand-text">Bem-vindo(a) ao EduFood!</h1>
                    <p className="text-brand-text-secondary mt-1 text-sm">Seu assistente para uma nutrição familiar mais inteligente.</p>
                </div>
                
                <div className="bg-brand-surface p-6 rounded-xl shadow-edu-lg">
                    <form onSubmit={handleAuthAction} className="space-y-4">
                        {!isLogin && (
                             <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-secondary" />
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Nome da Família"
                                    required
                                    className="w-full bg-brand-background border border-brand-border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text placeholder:text-brand-text-secondary"
                                />
                            </div>
                        )}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-secondary" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="E-mail"
                                required
                                className="w-full bg-brand-background border border-brand-border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text placeholder:text-brand-text-secondary"
                            />
                        </div>
                        <div className="relative">
                             <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-secondary" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Senha"
                                required
                                className="w-full bg-brand-background border border-brand-border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text placeholder:text-brand-text-secondary"
                            />
                        </div>
                         {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-primary text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors hover:bg-brand-dark disabled:bg-gray-400 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <LoaderCircle className="animate-spin h-5 w-5" />
                            ) : (
                                isLogin ? 'Entrar' : 'Criar Conta'
                            )}
                        </button>
                    </form>

                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-brand-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-brand-surface text-brand-text-secondary">OU</span>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-brand-border text-brand-text font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                         <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.35 6.48C12.73 13.72 17.97 9.5 24 9.5z"></path>
                            <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h12.8c-.57 3.32-2.31 6.17-4.79 8.09l7.92 6.18C44.19 39.42 46.98 32.74 46.98 24.55z"></path>
                            <path fill="#FBBC05" d="M10.91 28.74c-.5-1.51-.78-3.13-.78-4.74s.28-3.23.78-4.74l-8.35-6.48C.73 16.25 0 20.06 0 24s.73 7.75 2.56 11.22l8.35-6.48z"></path>
                            <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.92-6.18c-2.11 1.43-4.8 2.27-7.97 2.27-6.03 0-11.26-4.22-13.09-9.98l-8.35 6.48C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        Continuar com Google
                    </button>
                    
                    <div className="mt-5 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-sm text-brand-primary hover:underline"
                        >
                            {isLogin
                                ? "Não tem uma conta? Cadastre-se"
                                : "Já tem uma conta? Faça login"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
