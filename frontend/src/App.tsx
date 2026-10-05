import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuth';
import { authApi, inscricaoApi, candidatoApi } from './utils/api';
import { InscricaoWizard } from './components/wizard/InscricaoWizard';
import { AdminPanel } from './components/admin/AdminPanel';
import { MinhaInscricaoPage } from './pages/MinhaInscricaoPage';
import { CompletarCadastroPage } from './pages/CompletarCadastroPage';
import { maskCpf } from './utils/masks';
import type { Ingrediente } from './types';
import { LandingPage } from './pages/LandingPage';

// Mesma lista de LandingPage.tsx — ao publicar retificação nova, editar as DUAS listas.
const EDITAL_DOCUMENTOS = [
  { label: 'Edital Original', arquivo: '/edital-merendachef.pdf' },
  { label: 'Retificação nº 1', arquivo: '/edital-merendachef-retificacao-1.pdf' },
];

// ── Toast ──────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, type === 'error' ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, [onClose, type]);

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium
      ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
      <span>{type === 'error' ? '⚠️' : '✅'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">✕</button>
    </div>
  );
}

// ── Modal Erro ─────────────────────────────────────────────────
function ModalErro({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
        onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Atenção</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <button onClick={onClose}
          className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition">
          Entendido
        </button>
      </div>
    </div>
  );
}

// ── Eye Icon ───────────────────────────────────────────────────
function EyeIcon({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button type="button" onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
      {show ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

// ── Password Input ─────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, className }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
      <EyeIcon show={show} toggle={() => setShow(s => !s)} />
    </div>
  );
}

// ── Auth Guard ─────────────────────────────────────────────────
function PrivateRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { token, role: userRole } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── Erro Inline ────────────────────────────────────────────────
function ErroInline({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
      <span className="flex-shrink-0">⚠️</span>
      <span>{message}</span>
    </div>
  );
}

// ── Hint de senha ──────────────────────────────────────────────
function SenhaHint({ senha }: { senha: string }) {
  const regras = [
    { ok: senha.length >= 8, texto: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(senha), texto: 'Uma letra maiúscula' },
    { ok: /[a-z]/.test(senha), texto: 'Uma letra minúscula' },
    { ok: /[^a-zA-Z0-9]/.test(senha), texto: 'Um símbolo (@, #, !, etc)' },
  ];
  if (!senha) return null;
  return (
    <div className="mt-1 space-y-1">
      {regras.map(r => (
        <p key={r.texto} className={`text-xs flex items-center gap-1 ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{r.ok ? '✅' : '○'}</span> {r.texto}
        </p>
      ))}
    </div>
  );
}

// ── Login Page ─────────────────────────────────────────────────
function LoginPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalErro, setModalErro] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [mode, setMode] = useState<'login' | 'registro'>('login');
  const [regData, setRegData] = useState({ nome: '', cpf: '', email: '', senha: '', confirmarSenha: '' });
  const [regError, setRegError] = useState('');

  // Esqueci senha
  const [modalReset, setModalReset] = useState(false);
  const [resetCpf, setResetCpf] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setModalErro('');
  try {
    const res = await authApi.login({ cpf: cpf.replace(/\D/g, ''), senha });
    setAuth(res.data.token, res.data.nome, 'candidato', res.data.primeiroAcesso);
    
    // Aguarda o estado ser atualizado antes de navegar
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (res.data.primeiroAcesso) {
      navigate('/trocar-senha');
    } else {
      try {
        const perfil = await candidatoApi.getPerfil();
        navigate(perfil.data.cadastroCompleto ? '/minha-inscricao' : '/completar-cadastro');
      } catch {
        navigate('/completar-cadastro');
      }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    setModalErro(err.response?.data?.error || 'CPF ou senha inválidos.');
  } finally { setLoading(false); }
};

  const senhaValida = (s: string) =>
    s.length >= 8 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /[^a-zA-Z0-9]/.test(s);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!senhaValida(regData.senha)) {
      setRegError('A senha não atende aos requisitos mínimos.'); return;
    }
    if (regData.senha !== regData.confirmarSenha) {
      setRegError('As senhas não coincidem.'); return;
    }
    setLoading(true);
    try {
      await authApi.registrar({
        nome: regData.nome,
        cpf: regData.cpf.replace(/\D/g, ''),
        email: regData.email,
        senha: regData.senha,
      });
      setToast({ message: 'Cadastro realizado! Faça login para continuar.', type: 'success' });
      setMode('login');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setModalErro(err.response?.data?.error || 'Erro no cadastro.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingReset(true);
    try {
      await authApi.resetSenha(resetCpf.replace(/\D/g, ''));
      setModalReset(false);
      setResetCpf('');
      setToast({ message: 'Nova senha enviada para o seu e-mail!', type: 'success' });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setModalErro(err.response?.data?.error || 'CPF não encontrado.');
      setModalReset(false);
    } finally { setLoadingReset(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ModalErro message={modalErro} onClose={() => setModalErro('')} />

      {/* Modal Esqueci Senha */}
      {modalReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => { setModalReset(false); setResetCpf(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔑</div>
              <h3 className="text-lg font-bold text-gray-800">Esqueci minha senha</h3>
              <p className="text-sm text-gray-500 mt-1">
                Digite seu CPF e enviaremos uma nova senha temporária para o e-mail cadastrado.
              </p>
            </div>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
                <input type="text" placeholder="000.000.000-00"
                  value={resetCpf}
                  onChange={e => setResetCpf(maskCpf(e.target.value))}
                  maxLength={14}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none"
                  required />
              </div>
              <button type="submit" disabled={loadingReset}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50">
                {loadingReset ? 'Enviando...' : 'Enviar nova senha'}
              </button>
              <button type="button" onClick={() => { setModalReset(false); setResetCpf(''); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo3D.png" alt="MerendaChef" className="w-40 h-40 rounded-3xl shadow-lg mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900">MerendaChef</h1>
          <p className="text-orange-600 font-medium mt-1">Concurso Culinário FAETEC 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(['login', 'registro'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setModalErro(''); setRegError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition
                  ${mode === m ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
                <input type="text" placeholder="000.000.000-00"
                  value={cpf}
                  onChange={e => setCpf(maskCpf(e.target.value))}
                  maxLength={14}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
                <PasswordInput value={senha} onChange={e => setSenha(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none pr-10" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50 shadow">
                {loading ? 'Entrando...' : 'Entrar →'}
              </button>
              <button type="button"
                onClick={() => { setModalReset(true); setResetCpf(''); }}
                className="w-full text-sm text-orange-500 hover:text-orange-700 text-center">
                Esqueci minha senha
              </button>
            </form>
          )}

          {mode === 'registro' && (
            <form onSubmit={handleRegistro} className="space-y-4">
              <ErroInline message={regError} />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                <input type="text" placeholder="Seu nome completo"
                  value={regData.nome}
                  onChange={e => { setRegData(d => ({ ...d, nome: e.target.value })); setRegError(''); }}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
                <input type="text" placeholder="000.000.000-00"
                  value={regData.cpf}
                  onChange={e => { setRegData(d => ({ ...d, cpf: maskCpf(e.target.value) })); setRegError(''); }}
                  maxLength={14}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
                <input type="email" placeholder="seu@email.com"
                  value={regData.email}
                  onChange={e => { setRegData(d => ({ ...d, email: e.target.value })); setRegError(''); }}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
                <PasswordInput value={regData.senha}
                  onChange={e => { setRegData(d => ({ ...d, senha: e.target.value })); setRegError(''); }}
                  placeholder="Crie uma senha forte"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none pr-10" />
                <SenhaHint senha={regData.senha} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar Senha</label>
                <PasswordInput value={regData.confirmarSenha}
                  onChange={e => { setRegData(d => ({ ...d, confirmarSenha: e.target.value })); setRegError(''); }}
                  placeholder="Repita a senha"
                  className={`w-full border rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none pr-10
                    ${regData.confirmarSenha && regData.senha !== regData.confirmarSenha
                      ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                {regData.confirmarSenha && regData.senha !== regData.confirmarSenha && (
                  <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                )}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50 shadow">
                {loading ? 'Cadastrando...' : 'Criar Conta →'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-4 space-y-2">
          <div>
            <Link to="/insumos" className="text-xs text-orange-500 hover:text-orange-700">
              🥕 Consultar insumos disponíveis
            </Link>
          </div>
          <div className="flex justify-center">
            <details className="relative inline-block text-left">
              <summary className="text-xs text-blue-500 hover:text-blue-700 font-medium cursor-pointer">
                📋 Edital e Retificações
              </summary>
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[220px] z-20 text-left">
                {EDITAL_DOCUMENTOS.map(doc => (
                  <a key={doc.arquivo} href={doc.arquivo} target="_blank" rel="noreferrer"
                    className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
                    📄 {doc.label}
                  </a>
                ))}
              </div>
            </details>
          </div>
          <div>
            <Link to="/admin/login" className="text-xs text-gray-400 hover:text-gray-600">Acesso Administrativo</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inscricao Page ─────────────────────────────────────────────
function InscricaoPage() {
  const { nome, logout } = useAuthStore();
  const navigate = useNavigate();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [checandoPerfil, setChecandoPerfil] = useState(true);

  useEffect(() => {
    inscricaoApi.ingredientes().then(r => setIngredientes(r.data));
    candidatoApi.getPerfil()
      .then(r => {
        if (!r.data.cadastroCompleto) {
          navigate('/completar-cadastro');
        } else {
          setChecandoPerfil(false);
        }
      })
      .catch(() => navigate('/completar-cadastro'));
  }, [navigate]);

  if (checandoPerfil) {
    return <div className="min-h-screen bg-orange-50 flex items-center justify-center text-gray-500">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo3D.png" alt="MerendaChef" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-orange-700">MerendaChef</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">Olá, {nome}</span>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-sm text-gray-500 hover:text-gray-700">Sair</button>
        </div>
      </header>
      <div className="py-4">
        <h1 className="text-center text-2xl font-black text-gray-800 mb-1">Nova Receita</h1>
        <p className="text-center text-gray-500 text-sm mb-4">Concurso Culinário FAETEC 2026</p>
        <InscricaoWizard ingredientes={ingredientes} />
      </div>
    </div>
  );
}

// ── Admin Login Page ────────────────────────────────────────────
function AdminLoginPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalErro, setModalErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setModalErro('');
    try {
      const res = await authApi.adminLogin({ email, senha });
      setAuth(res.data.token, res.data.nome, 'admin');
      navigate('/admin');
    } catch {
      setModalErro('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center p-4">
      <ModalErro message={modalErro} onClose={() => setModalErro('')} />
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <img src="/logo3D.png" alt="MerendaChef" className="w-16 h-16 rounded-2xl mx-auto mb-2" />
          <h2 className="text-xl font-bold">Acesso Administrativo</h2>
          <p className="text-gray-500 text-sm">MerendaChef — FAETEC</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="E-mail" value={email}
            onChange={e => { setEmail(e.target.value); }}
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none" required />
          <PasswordInput value={senha} onChange={e => { setSenha(e.target.value); }}
            placeholder="Senha"
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none pr-10" />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600">← Voltar ao portal</Link>
        </div>
      </div>
    </div>
  );
}

// ── Página Pública de Insumos ──────────────────────────────────
function InsumoPage() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    inscricaoApi.ingredientes()
      .then(r => setIngredientes(r.data))
      .finally(() => setLoading(false));
  }, []);

  const categorias = [...new Set(ingredientes.map(i => i.categoria))].sort();
  const filtered = ingredientes.filter(i =>
    i.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo3D.png" alt="MerendaChef" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-orange-700">MerendaChef</span>
        </div>
        <Link to="/login" className="text-sm text-orange-600 font-semibold hover:text-orange-800">
          Fazer Inscrição →
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-800 mb-2">🥕 Insumos Disponíveis</h1>
          <p className="text-gray-500 text-sm">
            Consulte os ingredientes do Anexo I (Pregão FAETEC) disponíveis para sua receita antes de se inscrever.
          </p>
        </div>

        <input type="text" placeholder="🔍 Buscar ingrediente..."
          value={busca} onChange={e => setBusca(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-3 mb-6 focus:ring-2 focus:ring-orange-400 outline-none bg-white shadow-sm" />

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando ingredientes...</div>
        ) : (
          <div className="space-y-4">
            {categorias.map(cat => {
              const items = filtered.filter(i => i.categoria === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
                  <div className="bg-orange-500 px-4 py-2">
                    <h2 className="font-bold text-white text-sm">{cat}</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map(ing => (
                      <div key={ing.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-800">{ing.nome}</span>
                          {ing.isInNatura && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              In Natura
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{ing.unidadeMedida}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/login"
            className="inline-block px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition shadow">
            Fazer minha inscrição →
          </Link>
        </div>
      </div>
    </div>
  );
}

function TrocarSenhaPage() {
  const { nome, logout } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalErro, setModalErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (form.novaSenha !== form.confirmar) { setError('As senhas não coincidem.'); return; }
  if (form.novaSenha.length < 8) { setError('A nova senha deve ter no mínimo 8 caracteres.'); return; }
  setLoading(true);
  setError('');
  try {
    await authApi.trocarSenha({ senhaAtual: form.senhaAtual, novaSenha: form.novaSenha });
    logout();
    navigate('/login');
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    setModalErro(err.response?.data?.error || 'Erro ao trocar senha.');
  } finally { setLoading(false); }
};

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <ModalErro message={modalErro} onClose={() => setModalErro('')} />
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-orange-100">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800">Trocar Senha</h2>
          <p className="text-gray-500 text-sm mt-1">Olá, {nome}! Crie uma nova senha para continuar.</p>
        </div>
        {error && <ErroInline message={error} />}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {[
            { key: 'senhaAtual', label: 'Senha Temporária' },
            { key: 'novaSenha', label: 'Nova Senha (mín. 8 caracteres)' },
            { key: 'confirmar', label: 'Confirmar Nova Senha' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <PasswordInput
                value={form[key as keyof typeof form]}
                onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setError(''); }}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-400 outline-none pr-10"
              />
            </div>
          ))}
          {form.novaSenha && <SenhaHint senha={form.novaSenha} />}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar e Continuar →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── App Router ─────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/insumos" element={<InsumoPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/inscricao" element={<PrivateRoute role="candidato"><InscricaoPage /></PrivateRoute>} />
        <Route path="/completar-cadastro" element={<PrivateRoute role="candidato"><CompletarCadastroPage /></PrivateRoute>} />
        <Route path="/minha-inscricao" element={<PrivateRoute role="candidato"><MinhaInscricaoPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminPanel /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/trocar-senha" element={<PrivateRoute role="candidato"><TrocarSenhaPage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}