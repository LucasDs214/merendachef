import axios from 'axios';

// ── Spinner Global ─────────────────────────────────────────────
let requestCount = 0;

function showSpinner() {
  requestCount++;
  let el = document.getElementById('global-spinner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-spinner';
    el.innerHTML = `
      <div style="
        position:fixed;top:0;left:0;right:0;bottom:0;
        background:rgba(0,0,0,0.15);
        display:flex;align-items:center;justify-content:center;
        z-index:9999;backdrop-filter:blur(1px);
      ">
        <div style="
          background:white;border-radius:16px;
          padding:24px 32px;
          display:flex;align-items:center;gap:14px;
          box-shadow:0 8px 32px rgba(0,0,0,0.18);
        ">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5"
            style="animation:spin 0.8s linear infinite;">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span style="font-family:Arial,sans-serif;font-size:15px;font-weight:600;color:#374151;">Aguarde...</span>
        </div>
      </div>
      <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
}

function hideSpinner() {
  requestCount = Math.max(0, requestCount - 1);
  if (requestCount === 0) {
    const el = document.getElementById('global-spinner');
    if (el) el.style.display = 'none';
  }
}

// ── Axios ──────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

api.interceptors.request.use(config => {
  showSpinner();
  const token = localStorage.getItem('mc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => {
    if (!(r.config as any)._skipSpinner) hideSpinner();
    return r;
  },
  err => {
    if (!(err.config as any)._skipSpinner) hideSpinner();
    // Só redireciona para login se NÃO for rota de auth
    if (err.response?.status === 401) {
      const isAuthRoute = ['/api/auth/login', '/api/auth/admin/login', '/api/auth/reset-senha']
        .some(r => err.config?.url?.includes(r));
      if (!isAuthRoute) {
        localStorage.removeItem('mc_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  registrar: (data: { nome: string; cpf: string; email: string; senha: string }) =>
    api.post('/api/auth/registro', data),
  login: (data: { cpf: string; senha: string }) =>
    api.post('/api/auth/login', data),
  trocarSenha: (data: { senhaAtual: string; novaSenha: string }) =>
    api.post('/api/auth/trocar-senha', data),
  adminLogin: (data: { email: string; senha: string }) =>
    api.post('/api/auth/admin/login', data),
  resetSenha: (cpf: string) =>
    api.post('/api/auth/reset-senha', { cpf }),
};

// Inscrições
export const inscricaoApi = {
  enviar: (formData: FormData) =>
    api.post('/api/inscricoes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  atualizar: (id: string, formData: FormData) =>
    api.put(`/api/inscricoes/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  minhas: () => api.get('/api/inscricoes/minhas'),
  ingredientes: () => api.get('/api/inscricoes/ingredientes'),
};

// Perfil do candidato (dados funcionais + comprovante — preenchidos uma vez, fora do wizard de receita)
export const candidatoApi = {
  getPerfil: () => api.get('/api/candidatos/perfil'),
  atualizarPerfil: (formData: FormData) =>
    api.put('/api/candidatos/perfil', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Admin
export const adminApi = {
  listar: (status?: string) =>
    api.get('/api/admin/inscricoes', { params: status ? { status } : {} }),
  habilitar: (id: string) =>
    api.patch(`/api/admin/inscricoes/${id}/habilitar`),
  eliminar: (id: string, motivo: string) =>
    api.patch(`/api/admin/inscricoes/${id}/eliminar`, { motivo }),
  lancarNotas: (id: string, notas: object) =>
    api.patch(`/api/admin/inscricoes/${id}/notas`, notas),
  ranking: () =>
    api.get('/api/admin/ranking'),
    candidatosSemReceita: () =>
    api.get('/api/admin/candidatos-sem-receita'),
  resetarSenhaCandidato: (id: string, novaSenha: string) =>
    api.post(`/api/admin/candidatos/${id}/reset-senha`, { novaSenha }),
  convocar: (id: string, dados: object) =>
    api.patch(`/api/admin/inscricoes/${id}/convocar`, dados),
  listarAdmins: () =>
    api.get('/api/admin/admins'),
  criarAdmin: (dados: object) =>
    api.post('/api/admin/admins', dados),
  getConfiguracoes: () =>
    api.get('/api/admin/configuracoes'),
  salvarConfiguracoes: (dados: object) =>
    api.patch('/api/admin/configuracoes', dados),
  resetSenhaCandidato: (id: string, novaSenha: string) =>
    api.post(`/api/admin/candidatos/${id}/reset-senha`, { novaSenha }),
};