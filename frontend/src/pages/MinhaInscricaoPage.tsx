import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inscricaoApi } from '../utils/api';
import { useAuthStore } from '../hooks/useAuth';
import { InscricaoWizard } from '../components/wizard/InscricaoWizard';
import type { Ingrediente, TipoReceita } from '../types';
import { TIPO_RECEITA_LABEL } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface CandidatoInfo {
  nome: string; cpf: string; email: string; telefone: string;
  unidadeEscolar: string; nomeDiretor: string; matricula: string; cargo: string;
  comprovanteVinculo?: string;
}

interface MinhaInscricao {
  id: string;
  candidato: CandidatoInfo;
  nomeReceita: string;
  tipoReceita?: TipoReceita | '';
  descricao: string;
  modoPreparo?: string;
  fotoReceita?: string;
  aceitouLgpd?: boolean;
  autorizouUsoImagem?: boolean;
  aceitouTermosUso?: boolean;
  declarouSemParentesco?: boolean;
  hashInscricao?: string;
  dataConfirmacao?: string;
  status: 'Pendente' | 'Habilitada' | 'Eliminada' | 'ConvocadoSegundaFase';
  motivoEliminacao?: string;
  dataSegundaFase?: string;
  localSegundaFase?: string;
  convocadoEm?: string;
  ingredientes: Array<{ id: number; nome: string; isInNatura: boolean; quantidade?: string }>;
  criadaEm: string;
  podeEditar?: boolean;
  prazoEdicao?: string;
}

const statusConfig = {
  Pendente: {
    cor: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-100 text-yellow-800',
    icone: '⏳', titulo: 'Inscrição em Análise',
    descricao: 'Sua inscrição foi recebida e está sendo analisada pela equipe FAETEC.'
  },
  Habilitada: {
    cor: 'bg-green-50 border-green-300', badge: 'bg-green-100 text-green-800',
    icone: '✅', titulo: 'Inscrição Habilitada',
    descricao: 'Sua inscrição foi aprovada na análise técnica! Aguarde o resultado da fase classificatória.'
  },
  Eliminada: {
    cor: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-800',
    icone: '❌', titulo: 'Inscrição Eliminada',
    descricao: 'Infelizmente sua inscrição foi eliminada na análise técnica.'
  },
  ConvocadoSegundaFase: {
    cor: 'bg-orange-50 border-orange-400', badge: 'bg-orange-100 text-orange-800',
    icone: '🏆', titulo: 'Parabéns! Convocado para a 2ª Fase!',
    descricao: 'Sua receita foi selecionada entre as 20 melhores! Você está convocado para a etapa presencial.'
  }
};

export function MinhaInscricaoPage() {
  const { nome, logout } = useAuthStore();
  const navigate = useNavigate();
  const [inscricoes, setInscricoes] = useState<MinhaInscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalArquivo, setModalArquivo] = useState<{ url: string; tipo: 'imagem' | 'pdf' } | null>(null);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);

  const carregar = () => {
    setLoading(true);
    inscricaoApi.minhas()
      .then(r => setInscricoes(r.data))
      .catch(() => setInscricoes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
    inscricaoApi.ingredientes().then(r => setIngredientes(r.data));
  }, []);

  const formatarData = (data: string) =>
    new Date(data).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const abrirArquivo = (caminho: string) => {
    const url = `${API_URL}/uploads/${caminho}`;
    const ext = caminho.split('.').pop()?.toLowerCase();
    setModalArquivo({ url, tipo: ext === 'pdf' ? 'pdf' : 'imagem' });
  };

  const selecionada = inscricoes.find(i => i.id === selecionadaId) || null;

  const HeaderBar = ({ voltar }: { voltar?: () => void }) => (
    <header className="bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/favicon.png" alt="MerendaChef" className="w-8 h-8 rounded-lg" />
        <span className="font-bold text-orange-700">MerendaChef</span>
      </div>
      <div className="flex items-center gap-3">
        {voltar && (
          <button onClick={voltar} className="text-sm text-orange-600 hover:text-orange-800 font-semibold">
            ← Voltar à lista
          </button>
        )}
        <button onClick={() => navigate('/completar-cadastro')} className="text-sm text-gray-500 hover:text-orange-600">
          👤 Meus Dados
        </button>
        <span className="text-sm text-gray-600 hidden sm:block">Olá, {nome}</span>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="text-sm text-gray-500 hover:text-gray-700">Sair</button>
      </div>
    </header>
  );

  // ── Modo edição — abre o wizard com dados preenchidos ──────────
  if (modoEdicao && selecionada) {
    const dadosIniciais: Partial<import('../types').WizardData> = {
      nomeReceita: selecionada.nomeReceita,
      tipoReceita: selecionada.tipoReceita || '',
      descricao: selecionada.descricao,
      modoPreparo: selecionada.modoPreparo || '',
      ingredientes: selecionada.ingredientes.map(i => ({ id: i.id, quantidade: i.quantidade || '' })),
      // Os aceites precisam ser reconfirmados a cada edição (não pré-marcamos automaticamente),
      // conforme itens 9.3/9.4/9.11 do Edital — a reafirmação do consentimento é intencional.
    };

    return (
      <div className="min-h-screen bg-orange-50">
        <HeaderBar voltar={() => setModoEdicao(false)} />
        <div className="py-4">
          <h1 className="text-center text-2xl font-black text-gray-800 mb-1">Editar Receita</h1>
          <p className="text-center text-gray-500 text-sm mb-4">{selecionada.nomeReceita}</p>
          <InscricaoWizard
            ingredientes={ingredientes}
            modoEdicao={true}
            inscricaoId={selecionada.id}
            dadosIniciais={dadosIniciais}
            onSucesso={() => {
              setModoEdicao(false);
              carregar();
            }}
          />
        </div>
      </div>
    );
  }

  // ── Visualização de uma inscrição específica ───────────────────
  if (selecionada) {
    const config = statusConfig[selecionada.status];
    return (
      <div className="min-h-screen bg-orange-50">
        <HeaderBar voltar={() => setSelecionadaId(null)} />

        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-black text-gray-800 mb-1 text-center">Detalhes da Receita</h1>
          <p className="text-center text-gray-500 text-sm mb-6">Concurso Culinário FAETEC 2026</p>

          <div className="space-y-4">
            {/* Status */}
            <div className={`rounded-2xl border-2 p-6 ${config.cor}`}>
              <div className="flex items-start gap-4">
                <span className="text-4xl">{config.icone}</span>
                <div className="flex-1">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.badge}`}>
                    {selecionada.status === 'ConvocadoSegundaFase' ? '2ª FASE' : selecionada.status.toUpperCase()}
                  </span>
                  <h2 className="text-lg font-bold text-gray-800 mt-1">{config.titulo}</h2>
                  <p className="text-sm text-gray-600 mt-1">{config.descricao}</p>
                  {selecionada.motivoEliminacao && (
                    <p className="text-sm text-red-700 mt-2 font-medium">Motivo: {selecionada.motivoEliminacao}</p>
                  )}
                </div>
              </div>

              {selecionada.status === 'ConvocadoSegundaFase' && (
                <div className="mt-4 bg-white rounded-xl p-4 border border-orange-200 space-y-3">
                  <h3 className="font-bold text-orange-800 text-sm uppercase tracking-wide">📋 Etapa Presencial</h3>
                  {selecionada.dataSegundaFase && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-2xl">📅</span>
                      <div>
                        <p className="text-gray-500 text-xs">Data e Horário</p>
                        <p className="font-bold text-gray-800">{formatarData(selecionada.dataSegundaFase)}</p>
                      </div>
                    </div>
                  )}
                  {selecionada.localSegundaFase && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-2xl">📍</span>
                      <div>
                        <p className="text-gray-500 text-xs">Local</p>
                        <p className="font-bold text-gray-800">{selecionada.localSegundaFase}</p>
                      </div>
                    </div>
                  )}
                  {selecionada.convocadoEm && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-2xl">🔔</span>
                      <div>
                        <p className="text-gray-500 text-xs">Convocado em</p>
                        <p className="font-medium text-gray-700">{formatarData(selecionada.convocadoEm)}</p>
                      </div>
                    </div>
                  )}
                  <div className="bg-orange-50 rounded-lg p-3 text-xs text-orange-800 border border-orange-200">
                    ⚠️ Compareça com <strong>no mínimo 30 minutos de antecedência</strong> munido de documento de identidade com foto.
                  </div>
                </div>
              )}
            </div>

            {/* Botão Editar */}
            {selecionada.podeEditar && (
              <button
                onClick={() => setModoEdicao(true)}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition shadow flex items-center justify-center gap-2">
                ✏️ Editar Receita
                {selecionada.prazoEdicao && (
                  <span className="text-xs text-orange-200 font-normal">
                    (prazo: {formatarData(selecionada.prazoEdicao)})
                  </span>
                )}
              </button>
            )}

            {/* Prazo expirado */}
            {selecionada.podeEditar === false && selecionada.prazoEdicao && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center text-sm text-gray-500">
                🔒 Prazo de edição encerrado em {formatarData(selecionada.prazoEdicao)}
              </div>
            )}

            {/* Comprovante */}
            {selecionada.hashInscricao && (
              <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3">🔑 Comprovante de Inscrição</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-center border">
                  <p className="text-xs text-gray-500 mb-1">Código de Verificação</p>
                  <p className="text-2xl font-black tracking-widest text-orange-600">{selecionada.hashInscricao}</p>
                  {selecionada.dataConfirmacao && (
                    <p className="text-xs text-gray-400 mt-2">Confirmado em {formatarData(selecionada.dataConfirmacao)}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Guarde este código — poderá ser solicitado para comprovar esta inscrição.
                </p>
              </div>
            )}

            {/* Dados do Candidato */}
            {selecionada.candidato && (
              <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">👤 Seus Dados</h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {[
                    { label: 'Nome Completo', valor: selecionada.candidato.nome },
                    { label: 'CPF', valor: selecionada.candidato.cpf },
                    { label: 'E-mail', valor: selecionada.candidato.email },
                    { label: 'Telefone / WhatsApp', valor: selecionada.candidato.telefone },
                    { label: 'Unidade Escolar', valor: selecionada.candidato.unidadeEscolar },
                    { label: 'Diretor(a)', valor: selecionada.candidato.nomeDiretor },
                    { label: 'Matrícula', valor: selecionada.candidato.matricula },
                    { label: 'Cargo', valor: selecionada.candidato.cargo },
                  ].map(({ label, valor }) => valor ? (
                    <div key={label} className="flex justify-between items-start gap-4 py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-500 flex-shrink-0">{label}</span>
                      <span className="font-medium text-gray-800 text-right">{valor}</span>
                    </div>
                  ) : null)}
                </div>
                {selecionada.candidato.comprovanteVinculo && (
                  <div className="mt-4">
                    <button onClick={() => abrirArquivo(selecionada.candidato.comprovanteVinculo!)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition">
                      📄 Visualizar Comprovante de Vínculo
                    </button>
                  </div>
                )}
                <button onClick={() => navigate('/completar-cadastro')}
                  className="mt-3 text-xs text-orange-600 hover:text-orange-800 font-semibold">
                  ✏️ Editar meus dados
                </button>
              </div>
            )}

            {/* Receita */}
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">🍽️ Receita</h3>
              {selecionada.fotoReceita && (
                <img src={`${API_URL}/uploads/${selecionada.fotoReceita}`}
                  alt="Foto da receita"
                  className="w-full h-48 object-cover rounded-xl mb-4 border cursor-pointer hover:opacity-90"
                  onClick={() => abrirArquivo(selecionada.fotoReceita!)} />
              )}
              <h4 className="text-lg font-bold text-gray-800">{selecionada.nomeReceita}</h4>
              {selecionada.tipoReceita && (
                <span className="inline-block mt-1 text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  {TIPO_RECEITA_LABEL[selecionada.tipoReceita]}
                </span>
              )}
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{selecionada.descricao}</p>
              {selecionada.modoPreparo && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Modo de Preparo</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                    {selecionada.modoPreparo}
                  </p>
                </div>
              )}
            </div>

            {/* Ingredientes */}
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">🥕 Ingredientes ({selecionada.ingredientes.length})</h3>
              <div className="space-y-2">
                {selecionada.ingredientes.map(i => (
                  <div key={i.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border
                    ${i.isInNatura ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className={i.isInNatura ? 'text-green-700 font-medium' : 'text-gray-700'}>{i.nome}</span>
                      {i.isInNatura && (
                        <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded">In Natura</span>
                      )}
                    </div>
                    {i.quantidade && <span className="text-xs text-gray-500 font-medium">{i.quantidade}</span>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-600 mt-2">🌿 Verde = Alimento In Natura (PNAE)</p>
            </div>

            <p className="text-center text-xs text-gray-400">
              Inscrição realizada em {new Date(selecionada.criadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
        </div>

        {/* Modal Arquivo */}
        {modalArquivo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setModalArquivo(null)}>
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={e => e.stopPropagation()}>
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

  // ── Lista de inscrições (tela inicial) ──────────────────────────
  return (
    <div className="min-h-screen bg-orange-50">
      <HeaderBar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-800 mb-1 text-center">Minhas Inscrições</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Concurso Culinário FAETEC 2026</p>

        {loading && <div className="text-center py-12 text-gray-500">Carregando...</div>}

        {!loading && inscricoes.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center border border-orange-100">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Você ainda não se inscreveu</h2>
            <p className="text-gray-500 mb-6">Participe do concurso enviando sua receita!</p>
            <button onClick={() => navigate('/inscricao')}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">
              Fazer Inscrição
            </button>
          </div>
        )}

        {!loading && inscricoes.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-3 text-center">
              Conforme o Edital (item 4.9), você pode enviar quantas receitas quiser — cada uma é avaliada separadamente.
            </p>
            <div className="space-y-3">
              {inscricoes.map(insc => {
                const cfg = statusConfig[insc.status];
                return (
                  <button key={insc.id} onClick={() => setSelecionadaId(insc.id)}
                    className="w-full text-left bg-white rounded-2xl shadow p-4 border border-orange-100 hover:border-orange-300 hover:shadow-md transition flex items-center gap-4">
                    {insc.fotoReceita ? (
                      <img src={`${API_URL}/uploads/${insc.fotoReceita}`} alt=""
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0 border border-orange-100">
                        🍽️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {insc.status === 'ConvocadoSegundaFase' ? '2ª FASE' : insc.status.toUpperCase()}
                        </span>
                        {insc.tipoReceita && (
                          <span className="text-xs text-gray-400">{TIPO_RECEITA_LABEL[insc.tipoReceita]}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-800 truncate">{insc.nomeReceita || '(sem nome)'}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Enviada em {new Date(insc.criadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </p>
                    </div>
                    <span className="text-orange-300 text-xl flex-shrink-0">›</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {!loading && (
          <button onClick={() => navigate('/inscricao')}
            className="w-full mt-4 py-3 border-2 border-dashed border-orange-300 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition">
            + Nova Receita
          </button>
        )}
      </div>
    </div>
  );
}
