import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatoApi } from '../utils/api';
import { useAuthStore } from '../hooks/useAuth';
import { maskTelefone } from '../utils/masks';
import { FileDropzone } from '../components/wizard/InscricaoWizard';

const UNIDADES_FAETEC = [
  'ETE João Luiz do Nascimento',
  'ETE Juscelino Kubistschek',
  'Creche Casa da Criança',
  'ETE República',
  'Escola Especial Favo de Mel',
  'Iserj',
  'ETE Ferreira Viana',
  'ETE Imbariê',
  'Marechal Hermes Cozinha Central',
  'ETE Santa Cruz',
  'Fundamental República',
  'Henrique Lage - Barreto',
  'ETE Adolpho Bloch',
];

export function CompletarCadastroPage() {
  const { nome, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState('');
  const [comprovanteAtual, setComprovanteAtual] = useState<string | null>(null);
  const [jaTinhaCadastro, setJaTinhaCadastro] = useState(false);
  const [form, setForm] = useState({
    unidadeEscolar: '', nomeDiretor: '', matricula: '', cargo: '', telefone: '',
    comprovanteVinculo: null as File | null,
  });

  useEffect(() => {
    candidatoApi.getPerfil()
      .then(r => {
        setForm(f => ({
          ...f,
          unidadeEscolar: r.data.unidadeEscolar || '',
          nomeDiretor: r.data.nomeDiretor || '',
          matricula: r.data.matricula || '',
          cargo: r.data.cargo || '',
          telefone: r.data.telefone || '',
        }));
        setComprovanteAtual(r.data.comprovanteVinculo || null);
        setJaTinhaCadastro(!!r.data.cadastroCompleto);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.unidadeEscolar || !form.nomeDiretor || !form.matricula || !form.cargo || !form.telefone) {
      setError('Preencha todos os dados funcionais.');
      return;
    }
    if (!form.comprovanteVinculo && !comprovanteAtual) {
      setError('É necessário anexar o comprovante de vínculo funcional.');
      return;
    }
    setSalvando(true);
    try {
      const formData = new FormData();
      formData.append('unidadeEscolar', form.unidadeEscolar);
      formData.append('nomeDiretor', form.nomeDiretor);
      formData.append('matricula', form.matricula);
      formData.append('cargo', form.cargo);
      formData.append('telefone', form.telefone);
      if (form.comprovanteVinculo) formData.append('comprovanteVinculo', form.comprovanteVinculo);

      await candidatoApi.atualizarPerfil(formData);
      navigate('/minha-inscricao');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Erro ao salvar dados.');
    } finally { setSalvando(false); }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="MerendaChef" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-orange-700">MerendaChef</span>
        </div>
        <div className="flex items-center gap-3">
          {jaTinhaCadastro && (
            <button onClick={() => navigate('/minha-inscricao')} className="text-sm text-orange-600 hover:text-orange-800 font-semibold">
              ← Voltar
            </button>
          )}
          <span className="text-sm text-gray-600 hidden sm:block">Olá, {nome}</span>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-sm text-gray-500 hover:text-gray-700">Sair</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-800 mb-1 text-center">
          {jaTinhaCadastro ? 'Meus Dados' : 'Complete seu Cadastro'}
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          {jaTinhaCadastro
            ? 'Esses dados são usados em todas as suas receitas.'
            : 'Preencha uma vez só — esses dados serão usados em todas as receitas que você enviar.'}
        </p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Unidade Escolar (FAETEC)</label>
              <select value={form.unidadeEscolar} onChange={e => update('unidadeEscolar', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none">
                <option value="">Selecione...</option>
                {UNIDADES_FAETEC.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do(a) Diretor(a)</label>
              <input type="text" placeholder="Nome completo do(a) diretor(a)"
                value={form.nomeDiretor} onChange={e => update('nomeDiretor', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Matrícula do Funcionário</label>
              <input type="text" placeholder="Ex: 12345678"
                value={form.matricula} onChange={e => update('matricula', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cargo</label>
              <input type="text" placeholder="Ex: Merendeira, Auxiliar de Serviços..."
                value={form.cargo} onChange={e => update('cargo', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input type="text" placeholder="(21) 99999-9999"
                value={form.telefone}
                onChange={e => update('telefone', maskTelefone(e.target.value))}
                maxLength={15}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>

            {comprovanteAtual && !form.comprovanteVinculo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                ✅ Você já tem um comprovante enviado. Anexe outro arquivo abaixo só se quiser substituí-lo.
              </div>
            )}
            <FileDropzone
              label={comprovanteAtual ? 'Substituir Comprovante de Vínculo (opcional)' : 'Comprovante de Vínculo Funcional'}
              accept=".pdf,.jpg,.jpeg,.png"
              value={form.comprovanteVinculo}
              onChange={f => update('comprovanteVinculo', f)}
              hint="PDF, JPG ou PNG — máx. 10MB"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={salvando}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition shadow disabled:opacity-50">
              {salvando ? 'Salvando...' : jaTinhaCadastro ? '💾 Salvar Alterações' : 'Salvar e Continuar →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
