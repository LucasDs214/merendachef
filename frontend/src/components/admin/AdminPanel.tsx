import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useAuth';
import type { InscricaoAdmin, RankingItem } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

type Tab = 'inscricoes' | 'ranking' | 'sem-receita' | 'admins' | 'configuracoes';

interface CandidatoSemReceita {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  unidadeEscolar: string;
  nomeDiretor: string;
  cadastroCompleto: boolean;
  criadoEm: string;
}

interface AdminItem {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
}

const LABELS: Record<string, string> = {
  nome: 'Nome', cpf: 'CPF', email: 'E-mail', telefone: 'Telefone/WhatsApp',
  unidade: 'Unidade', diretor: 'Diretor(a)', matricula: 'Matrícula', cargo: 'Cargo'
};

const CRITERIOS = [
  { key: 'viabilidade', label: 'Viabilidade nas Cozinhas', max: 5 },
  { key: 'criatividade', label: 'Criatividade e Originalidade', max: 15 },
  { key: 'culturaRegional', label: 'Valorização Cultural', max: 10 },
  { key: 'alimentosInNatura', label: 'Alimentos In Natura (PNAE)', max: 20 },
];

export function AdminPanel() {
  const { logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>('inscricoes');
  const [inscricoes, setInscricoes] = useState<InscricaoAdmin[]>([]);
  const [todasInscricoes, setTodasInscricoes] = useState<InscricaoAdmin[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [semReceita, setSemReceita] = useState<CandidatoSemReceita[]>([]);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<InscricaoAdmin | null>(null);
  const [motivoElim, setMotivoElim] = useState('');
  const [notas, setNotas] = useState({ viabilidade: 0, criatividade: 0, culturaRegional: 0, alimentosInNatura: 0 });
  const [dadosConvocacao, setDadosConvocacao] = useState({ data: '', local: '' });
  const [novoAdmin, setNovoAdmin] = useState({ nome: '', email: '', senha: '' });
  const [adminMsg, setAdminMsg] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [modalArquivo, setModalArquivo] = useState<{ url: string; tipo: 'imagem' | 'pdf' } | null>(null);
  const [resultadoReset, setResultadoReset] = useState<{ nome: string; senha: string } | null>(null);
  const [loadingReset, setLoadingReset] = useState(false);
  const [config, setConfig] = useState({ prazoEdicao: '', inscricoesAbertas: true });
  const [configMsg, setConfigMsg] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const [filtradas, todas] = await Promise.all([
        adminApi.listar(filtroStatus || undefined),
        adminApi.listar(undefined)
      ]);
      setInscricoes(filtradas.data);
      setTodasInscricoes(todas.data);
    } finally { setLoading(false); }
  };

  const carregarRanking = async () => {
    const res = await adminApi.ranking();
    setRanking(res.data);
  };

  const carregarAdmins = async () => {
    const res = await adminApi.listarAdmins();
    setAdmins(res.data);
  };

  const carregarSemReceita = async () => {
    const res = await adminApi.candidatosSemReceita();
    setSemReceita(res.data);
  };

  const carregarConfig = async () => {
    try {
      const res = await adminApi.getConfiguracoes();
      setConfig({
        prazoEdicao: res.data.prazoEdicaoInscricao
          ? new Date(res.data.prazoEdicaoInscricao).toISOString().slice(0, 16)
          : '',
        inscricoesAbertas: res.data.inscricoesAbertas
      });
    } catch {}
  };

  const salvarConfig = async () => {
    setLoadingConfig(true);
    setConfigMsg(null);
    try {
      await adminApi.salvarConfiguracoes({
        prazoEdicaoInscricao: config.prazoEdicao ? new Date(config.prazoEdicao).toISOString() : null,
        inscricoesAbertas: config.inscricoesAbertas
      });
      setConfigMsg({ texto: 'Configurações salvas com sucesso!', tipo: 'sucesso' });
    } catch {
      setConfigMsg({ texto: 'Erro ao salvar configurações.', tipo: 'erro' });
    } finally { setLoadingConfig(false); }
  };

  useEffect(() => { carregar(); }, [filtroStatus]);
  useEffect(() => { if (tab === 'ranking') carregarRanking(); }, [tab]);
  useEffect(() => { if (tab === 'sem-receita') carregarSemReceita(); }, [tab]);
  useEffect(() => { if (tab === 'admins') carregarAdmins(); }, [tab]);
  useEffect(() => { if (tab === 'configuracoes') carregarConfig(); }, [tab]);

  const abrirFicha = (insc: InscricaoAdmin) => {
    setSelected(insc);
    setMotivoElim('');
    setDadosConvocacao({ data: '', local: '' });
    setNotas({
      viabilidade: insc.notas.viabilidade || 0,
      criatividade: insc.notas.criatividade || 0,
      culturaRegional: insc.notas.culturaRegional || 0,
      alimentosInNatura: insc.notas.alimentosInNatura || 0
    });
  };

  const habilitar = async (id: string) => {
    await adminApi.habilitar(id);
    carregar(); setSelected(null);
  };

  const eliminar = async (id: string) => {
    if (!motivoElim) { alert('Informe o motivo.'); return; }
    await adminApi.eliminar(id, motivoElim);
    setMotivoElim(''); carregar(); setSelected(null);
  };

  const lancarNotas = async (id: string) => {
    await adminApi.lancarNotas(id, notas);
    carregar(); setSelected(null);
  };

  const convocar = async (id: string) => {
    if (!dadosConvocacao.data || !dadosConvocacao.local) {
      alert('Preencha data e local.'); return;
    }
    await adminApi.convocar(id, {
      dataSegundaFase: dadosConvocacao.data,
      localSegundaFase: dadosConvocacao.local
    });
    carregar(); setSelected(null);
    setDadosConvocacao({ data: '', local: '' });
  };

  const criarAdmin = async () => {
    if (!novoAdmin.nome || !novoAdmin.email || !novoAdmin.senha) {
      setAdminMsg({ texto: 'Preencha todos os campos.', tipo: 'erro' }); return;
    }
    if (novoAdmin.senha.length < 8) {
      setAdminMsg({ texto: 'A senha deve ter no mínimo 8 caracteres.', tipo: 'erro' }); return;
    }
    setLoadingAdmin(true);
    try {
      await adminApi.criarAdmin(novoAdmin);
      setAdminMsg({ texto: 'Administrador criado com sucesso!', tipo: 'sucesso' });
      setNovoAdmin({ nome: '', email: '', senha: '' });
      carregarAdmins();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setAdminMsg({ texto: err.response?.data?.error || 'Erro ao criar administrador.', tipo: 'erro' });
    } finally { setLoadingAdmin(false); }
  };

  const abrirArquivo = (caminho: string) => {
    const url = `${API_URL}/uploads/${caminho}`;
    const ext = caminho.split('.').pop()?.toLowerCase();
    setModalArquivo({ url, tipo: ext === 'pdf' ? 'pdf' : 'imagem' });
  };

  // Edital: candidatos que esquecem a senha e não recebem o e-mail de reset (SMTP não é garantido)
  // precisam de um caminho alternativo — o admin gera uma senha temporária e repassa manualmente.
  const gerarSenhaTemporaria = (): string => {
    const maiusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const minusculas = 'abcdefghijkmnpqrstuvwxyz';
    const numeros = '23456789';
    const simbolos = '!@#$%&*';
    const todos = maiusculas + minusculas + numeros + simbolos;
    let senha =
      maiusculas[Math.floor(Math.random() * maiusculas.length)] +
      minusculas[Math.floor(Math.random() * minusculas.length)] +
      numeros[Math.floor(Math.random() * numeros.length)] +
      simbolos[Math.floor(Math.random() * simbolos.length)];
    for (let i = 0; i < 6; i++) senha += todos[Math.floor(Math.random() * todos.length)];
    return senha.split('').sort(() => Math.random() - 0.5).join('');
  };

  const resetarSenha = async (candidatoId: string, nomeCandidato: string) => {
    if (!window.confirm(`Gerar uma nova senha temporária para ${nomeCandidato}? A senha atual dele(a) deixará de funcionar imediatamente.`)) return;
    setLoadingReset(true);
    try {
      const novaSenha = gerarSenhaTemporaria();
      await adminApi.resetarSenhaCandidato(candidatoId, novaSenha);
      setResultadoReset({ nome: nomeCandidato, senha: novaSenha });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Erro ao resetar senha.');
    } finally { setLoadingReset(false); }
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      Pendente: 'bg-yellow-100 text-yellow-800',
      Habilitada: 'bg-green-100 text-green-800',
      Eliminada: 'bg-red-100 text-red-800',
      ConvocadoSegundaFase: 'bg-orange-100 text-orange-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[s] || ''}`}>{s}</span>;
  };

  const formatarData = (data: string) =>
    new Date(data).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const totalNotas = Object.values(notas).reduce((a, b) => a + b, 0);
  const notasInvalidas = notas.viabilidade > 5 || notas.criatividade > 15 ||
    notas.culturaRegional > 10 || notas.alimentosInNatura > 20 || totalNotas > 50;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg overflow-hidden">
            <img src="/favicon.png" alt="MerendaChef" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold">MerendaChef — Administração</h1>
            <p className="text-blue-200 text-sm">Painel de Gestão do Concurso FAETEC</p>
          </div>
        </div>
        <button onClick={() => { logout(); window.location.href = '/login'; }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-lg text-sm font-semibold transition">
          Sair →
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['inscricoes', 'ranking', 'sem-receita', 'admins', 'configuracoes'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-lg font-semibold transition
                ${tab === t ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-blue-50 border'}`}>
              {t === 'inscricoes' ? '📋 Inscrições' : t === 'ranking' ? '🏆 Ranking' : t === 'sem-receita' ? '📵 Sem Receita' : t === 'admins' ? '👤 Admins' : '⚙️ Configurações'}
            </button>
          ))}
        </div>

        {/* Inscrições */}
        {tab === 'inscricoes' && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              {['', 'Pendente', 'Habilitada', 'Eliminada', 'ConvocadoSegundaFase'].map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition
                    ${filtroStatus === s ? 'bg-blue-900 text-white' : 'bg-white border hover:bg-gray-50'}`}>
                  {s === '' ? 'Todas' : s === 'ConvocadoSegundaFase' ? '2ª Fase' : s} ({todasInscricoes.filter(i => !s || i.status === s).length})
                </button>
              ))}
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Carregando...</div>
            ) : (
              <div className="grid gap-3">
                {inscricoes.map(insc => (
                  <div key={insc.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
                    onClick={() => abrirFicha(insc)}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {statusBadge(insc.status)}
                          <span className="font-bold text-gray-800">{insc.receita.nome}</span>
                        </div>
                        <p className="text-sm text-gray-500">{insc.candidato.nome} — {insc.candidato.unidade}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {insc.ingredientes.length} ingredientes ({insc.ingredientes.filter(i => i.isInNatura).length} in natura)
                        </p>
                      </div>
                      {insc.notas.total && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">{insc.notas.total}</div>
                          <div className="text-xs text-gray-400">/ 50 pts</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Ranking */}
        {tab === 'ranking' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-900 text-white">
                <tr>
                  {['#', 'Candidato', 'Receita', 'In Natura', 'Viab.', 'Criativ.', 'Regional', 'Total', 'Ficha'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={i} className={`border-t ${r.posicao <= 3 ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 font-bold text-lg">
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : `${r.posicao}º`}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.candidato}</td>
                    <td className="px-4 py-3 text-gray-600">{r.nomeReceita}</td>
                    <td className="px-4 py-3">{r.notas.alimentosInNatura}</td>
                    <td className="px-4 py-3">{r.notas.viabilidade}</td>
                    <td className="px-4 py-3">{r.notas.criatividade}</td>
                    <td className="px-4 py-3">{r.notas.culturaRegional}</td>
                    <td className="px-4 py-3 font-bold text-orange-600">{r.notas.total}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          const insc = todasInscricoes.find(i => i.candidato.nome === r.candidato);
                          if (insc) abrirFicha(insc);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline">
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sem Receita */}
        {tab === 'sem-receita' && (
          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-800">
              💡 Candidatos que criaram conta no sistema mas ainda não enviaram nenhuma receita.
              Vale entrar em contato antes do prazo de inscrições encerrar (item 6 do Edital).
            </div>
            {semReceita.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
                🎉 Todo mundo que se cadastrou já enviou pelo menos uma receita!
              </div>
            ) : (
              <div className="grid gap-3">
                {semReceita.map(c => (
                  <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-gray-800">{c.nome}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                            ${c.cadastroCompleto ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {c.cadastroCompleto ? 'Cadastro completo, sem receita' : 'Cadastro incompleto'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{c.unidadeEscolar || '(unidade não informada)'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Conta criada em {formatarData(c.criadoEm)}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {c.telefone && (
                          <a href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                            className="text-xs font-semibold px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition">
                            📱 WhatsApp
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`}
                            className="text-xs font-semibold px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                            ✉️ E-mail
                          </a>
                        )}
                        <button onClick={() => resetarSenha(c.id, c.nome)} disabled={loadingReset}
                          className="text-xs font-semibold px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition disabled:opacity-50">
                          🔑 Resetar Senha
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admins */}
        {tab === 'admins' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">👤 Novo Administrador</h2>
              {adminMsg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${adminMsg.tipo === 'sucesso' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {adminMsg.tipo === 'sucesso' ? '✅' : '⚠️'} {adminMsg.texto}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                <input type="text" placeholder="Nome do administrador" value={novoAdmin.nome}
                  onChange={e => { setNovoAdmin(d => ({ ...d, nome: e.target.value })); setAdminMsg(null); }}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
                <input type="email" placeholder="email@faetec.rj.gov.br" value={novoAdmin.email}
                  onChange={e => { setNovoAdmin(d => ({ ...d, email: e.target.value })); setAdminMsg(null); }}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Senha (mín. 8 caracteres)</label>
                <input type="password" placeholder="Senha de acesso" value={novoAdmin.senha}
                  onChange={e => { setNovoAdmin(d => ({ ...d, senha: e.target.value })); setAdminMsg(null); }}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 outline-none" />
              </div>
              <button onClick={criarAdmin} disabled={loadingAdmin}
                className="w-full py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                {loadingAdmin ? 'Criando...' : '➕ Criar Administrador'}
              </button>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">👥 Administradores Cadastrados</h2>
              {admins.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum administrador encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {admins.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      <div className="w-9 h-9 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {a.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{a.nome}</p>
                        <p className="text-xs text-gray-500 truncate">{a.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(a.criadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configurações */}
        {tab === 'configuracoes' && (
          <div className="max-w-lg">
            <div className="bg-white rounded-xl border p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-800">⚙️ Configurações do Sistema</h2>

              {configMsg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${configMsg.tipo === 'sucesso' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {configMsg.tipo === 'sucesso' ? '✅' : '⚠️'} {configMsg.texto}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Prazo de Edição das Inscrições
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Após esta data/hora os candidatos não poderão mais editar suas inscrições.
                </p>
                <input type="datetime-local"
                  value={config.prazoEdicao}
                  onChange={e => setConfig(c => ({ ...c, prazoEdicao: e.target.value }))}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 outline-none text-sm" />
                {config.prazoEdicao && (
                  <p className="text-xs text-blue-600 mt-1">
                    📅 Prazo: {new Date(config.prazoEdicao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status das Inscrições</label>
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition
                  ${config.inscricoesAbertas ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <input type="checkbox"
                    checked={config.inscricoesAbertas}
                    onChange={e => setConfig(c => ({ ...c, inscricoesAbertas: e.target.checked }))}
                    className="accent-green-600 w-5 h-5" />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {config.inscricoesAbertas ? '✅ Inscrições abertas' : '🔒 Inscrições encerradas'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {config.inscricoesAbertas
                        ? 'Candidatos podem se inscrever normalmente.'
                        : 'Novas inscrições estão bloqueadas.'}
                    </p>
                  </div>
                </label>
              </div>

              <button onClick={salvarConfig} disabled={loadingConfig}
                className="w-full py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                {loadingConfig ? 'Salvando...' : '💾 Salvar Configurações'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ficha Técnica — fecha APENAS no X */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 overflow-y-auto z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mt-8 mb-8">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Ficha Técnica</h2>
                <p className="text-sm text-gray-500">{selected.receita.nome}</p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(selected.status)}
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Dados do Candidato */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-3">👤 Dados do Candidato</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {Object.entries(selected.candidato).filter(([k]) => k !== 'id').map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-0.5">{LABELS[k] || k}</span>
                      <span className="font-medium text-gray-800">{v || '—'}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => resetarSenha(selected.candidato.id, selected.candidato.nome)}
                  disabled={loadingReset}
                  className="mt-3 w-full py-2.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-100 transition disabled:opacity-50">
                  🔑 Resetar Senha do Candidato
                </button>
              </div>

              {/* Receita */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3">🍽️ Receita</h3>
                {selected.receita.foto && (
                  <img
                    src={`${API_URL}/uploads/${selected.receita.foto}`}
                    alt="Foto da receita"
                    className="rounded-xl w-full max-h-56 object-cover border cursor-pointer hover:opacity-90 transition mb-3"
                    onClick={() => abrirArquivo(selected.receita.foto!)}
                  />
                )}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Descrição</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selected.receita.descricao}</p>
                  </div>
                  {selected.receita.modoPreparo && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Modo de Preparo</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                        {selected.receita.modoPreparo}
                      </p>
                    </div>
                  )}
                  {selected.candidato.comprovante && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Comprovante de Vínculo</p>
                      <button onClick={() => abrirArquivo(selected.candidato.comprovante!)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition">
                        📄 Visualizar Comprovante
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingredientes */}
              <div>
                <h3 className="font-bold text-gray-700 mb-2">
                  🥕 Ingredientes ({selected.ingredientes.length} —{' '}
                  <span className="text-green-600">{selected.ingredientes.filter(i => i.isInNatura).length} in natura</span>)
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {selected.ingredientes.map(i => (
                    <div key={i.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border
                      ${i.isInNatura ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <span className={i.isInNatura ? 'text-green-700 font-medium' : 'text-gray-700'}>{i.nome}</span>
                        {i.isInNatura && <span className="text-xs bg-green-200 text-green-800 px-1.5 rounded">In Natura</span>}
                      </div>
                      {i.quantidade && <span className="text-xs text-gray-500 font-medium">{i.quantidade}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas já lançadas */}
              {selected.notas.total !== null && selected.notas.total !== undefined && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <h3 className="font-bold text-gray-700 mb-3">📊 Notas Lançadas</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {CRITERIOS.map(({ key, label, max }) => (
                      <div key={key} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
                        <span className="text-gray-500 text-xs">{label}</span>
                        <span className="font-bold text-orange-600">
                          {selected.notas[key as keyof typeof selected.notas] ?? 0}
                          <span className="text-gray-400 font-normal">/{max}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right mt-2 font-black text-orange-600 text-lg">
                    Total: {selected.notas.total} / 50
                  </div>
                </div>
              )}

              {/* Habilitação */}
              {selected.status === 'Pendente' && (
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-bold text-gray-700">⚖️ Habilitação Técnica</h3>
                  <button onClick={() => habilitar(selected.id)}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
                    ✅ Habilitar Inscrição
                  </button>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Motivo da eliminação..."
                      value={motivoElim} onChange={e => setMotivoElim(e.target.value)}
                      className="flex-1 border rounded-lg p-2 text-sm" />
                    <button onClick={() => eliminar(selected.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm">
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              {/* Lançar Notas */}
              {selected.status === 'Habilitada' && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-bold text-gray-700">📊 Lançar Notas <span className="text-gray-400 font-normal text-sm">(total: 50 pontos)</span></h3>
                  <div className="grid grid-cols-2 gap-3">
                    {CRITERIOS.map(({ key, label, max }) => {
                      const val = notas[key as keyof typeof notas];
                      const invalido = val < 0 || val > max;
                      return (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            {label} <span className="text-gray-400">(máx. {max} pts)</span>
                          </label>
                          <input
                            type="number" min={0} max={max}
                            value={val}
                            onChange={e => setNotas(n => ({ ...n, [key]: +e.target.value }))}
                            className={`w-full border rounded-lg p-2 text-center font-bold outline-none transition
                              ${invalido
                                ? 'border-red-400 bg-red-50 text-red-600 focus:ring-2 focus:ring-red-300'
                                : 'border-gray-300 focus:ring-2 focus:ring-blue-400'}`}
                          />
                          {invalido && (
                            <p className="text-xs text-red-500 mt-1">⚠️ Máximo {max} pontos</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm font-bold transition
                    ${notasInvalidas ? 'bg-red-50 border border-red-300 text-red-600' : 'bg-orange-50 border border-orange-200 text-orange-600'}`}>
                    <span>Total</span>
                    <span>
                      {totalNotas} / 50 pontos
                      {notasInvalidas && <span className="ml-2 text-xs font-normal">⚠️ Verifique os valores</span>}
                    </span>
                  </div>

                  <button
                    onClick={() => lancarNotas(selected.id)}
                    disabled={notasInvalidas}
                    className="w-full py-3 bg-blue-800 text-white rounded-xl font-semibold hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    💾 Salvar Notas
                  </button>

                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-bold text-gray-700">🏆 Convocar para 2ª Fase</h3>
                    <input type="datetime-local"
                      value={dadosConvocacao.data}
                      onChange={e => setDadosConvocacao(d => ({ ...d, data: e.target.value }))}
                      className="w-full border rounded-lg p-2 text-sm" />
                    <input type="text" placeholder="Local da etapa presencial..."
                      value={dadosConvocacao.local}
                      onChange={e => setDadosConvocacao(d => ({ ...d, local: e.target.value }))}
                      className="w-full border rounded-lg p-2 text-sm" />
                    <button onClick={() => convocar(selected.id)}
                      className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600">
                      🏆 Convocar Candidato
                    </button>
                  </div>
                </div>
              )}

              {/* Dados da Convocação */}
              {selected.status === 'ConvocadoSegundaFase' && selected.dataSegundaFase && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-700 mb-3">🏆 Dados da Convocação</h3>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 space-y-2 text-sm">
                    <p><span className="text-gray-500">📅 Data:</span> <span className="font-bold ml-1">{formatarData(selected.dataSegundaFase)}</span></p>
                    {selected.localSegundaFase && (
                      <p><span className="text-gray-500">📍 Local:</span> <span className="font-bold ml-1">{selected.localSegundaFase}</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Senha Resetada */}
      {resultadoReset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="text-4xl mb-3">🔑</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Nova senha gerada</h3>
            <p className="text-sm text-gray-500 mb-4">para <strong>{resultadoReset.nome}</strong></p>
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <p className="text-2xl font-black tracking-widest text-blue-900 select-all">{resultadoReset.senha}</p>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Envie esta senha ao candidato por WhatsApp, telefone ou pessoalmente. No próximo login, ele(a) será solicitado(a) a criar uma nova senha.
            </p>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(resultadoReset.senha)}
                className="flex-1 py-2.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-200">
                📋 Copiar
              </button>
              <button onClick={() => setResultadoReset(null)}
                className="flex-1 py-2.5 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Arquivo */}
      {modalArquivo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button onClick={() => setModalArquivo(null)}
              className="absolute top-2 right-2 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 z-10">
              ✕
            </button>
            {modalArquivo.tipo === 'imagem'
              ? <img src={modalArquivo.url} alt="Arquivo" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
              : <iframe src={modalArquivo.url} className="w-full h-[85vh] rounded-lg" title="Comprovante" />
            }
          </div>
        </div>
      )}
    </div>
  );
}