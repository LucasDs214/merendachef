import { create } from 'zustand';

interface AuthState {
  token: string | null;
  nome: string | null;
  role: 'candidato' | 'admin' | null;
  primeiroAcesso: boolean;
  setAuth: (token: string, nome: string, role: 'candidato' | 'admin', primeiroAcesso?: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: localStorage.getItem('mc_token'),
  nome: localStorage.getItem('mc_nome'),
  role: localStorage.getItem('mc_role') as 'candidato' | 'admin' | null,
  primeiroAcesso: false,
  setAuth: (token, nome, role, primeiroAcesso = false) => {
    localStorage.setItem('mc_token', token);
    localStorage.setItem('mc_nome', nome);
    localStorage.setItem('mc_role', role);
    set({ token, nome, role, primeiroAcesso });
  },
  logout: () => {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_nome');
    localStorage.removeItem('mc_role');
    set({ token: null, nome: null, role: null });
  },
}));
