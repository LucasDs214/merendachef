import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inscricaoApi } from '../../utils/api';
import type { WizardData, Ingrediente, TipoReceita } from '../../types';
import { TIPO_RECEITA_LABEL } from '../../types';

const STEPS = ['Ingredientes', 'Receita', 'Termos'];

const TERMOS_TEXTO = `TERMOS DE USO E POLÍTICA DE PRIVACIDADE
Concurso Culinário MerendaChef — FAETEC 2026

1. OBJETO
O presente termo regula a participação no Concurso Culinário MerendaChef, promovido pela Fundação de Apoio à Escola Técnica do Estado do Rio de Janeiro (FAETEC).

2. COLETA DE DADOS (LGPD)
Os dados pessoais coletados (nome, CPF, e-mail, telefone, matrícula) serão utilizados exclusivamente para fins de gestão do concurso, comunicação com os participantes e, mediante autorização expressa, para fins de pesquisa científica e institucional.

3. USO PARA PESQUISA CIENTÍFICA
Ao aceitar este termo, o participante autoriza o uso anonimizado de seus dados e da receita submetida para fins de pesquisa científica, estudos nutricionais e publicações institucionais da FAETEC, garantindo-se a privacidade do indivíduo.

4. USO DE IMAGEM, VOZ E CESSÃO DE DIREITOS AUTORAIS
No ato da adesão ao Concurso e anuência a este Edital, o participante autoriza gratuitamente, em caráter exclusivo, irrevogável, irretratável, definitivo e universal, a divulgação de seu nome, imagem e voz e do material enviado (receita/prato) e imagem (foto e/ou vídeo) no site do Concurso, autorizando também a ORGANIZADORA (FAETEC) ou qualquer parceiro a utilizar a receita inscrita, imagem e voz em quaisquer obras ou mídias por ela produzidas. Essas utilizações não têm limitação de tempo ou de número de vezes, podendo ocorrer no Brasil e/ou no exterior, sem que seja devida qualquer remuneração ou compensação ao participante. O participante cede expressamente os direitos autorais patrimoniais e de imagem relativos aos materiais produzidos em decorrência de sua participação, na forma do art. 93 da Lei nº 14.133/2021 e observado o disposto nos artigos 49 e 50 da Lei nº 9.610/1998. Esta autorização entra em vigor no ato da inscrição e perdura pelos prazos de proteção legal da obra previstos na Lei nº 9.610/1998.

5. VEDAÇÃO DE PARENTESCO
Não poderão participar do Concurso os cônjuges, ascendentes, descendentes e parentes até o 2º grau dos colaboradores/funcionários da ORGANIZADORA e dos membros das Comissões Julgadoras. O participante declara, sob as penas da lei, que não se enquadra em nenhuma dessas hipóteses.

6. ARMAZENAMENTO
Os dados serão armazenados de forma segura pelo período necessário à realização do concurso e por até 5 anos para fins de auditoria, conforme exige a legislação vigente.

7. DIREITOS DO TITULAR
O participante poderá solicitar acesso, correção ou exclusão de seus dados a qualquer momento, mediante contato com a FAETEC.

8. CONTATO
Para dúvidas: merenda.chef@faetec.rj.gov.br`;

interface Props {
  ingredientes: Ingrediente[];
  modoEdicao?: boolean;
  inscricaoId?: string;
  dadosIniciais?: Partial<WizardData>;
  onSucesso?: () => void;
}

export function InscricaoWizard({ ingredientes, modoEdicao = false, inscricaoId, dadosIniciais, onSucesso }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalTermos, setModalTermos] = useState(false);
  const [data, setData] = useState<WizardData>({
    nomeReceita: dadosIniciais?.nomeReceita || '',
    tipoReceita: dadosIniciais?.tipoReceita || '',
    descricao: dadosIniciais?.descricao || '',
    modoPreparo: dadosIniciais?.modoPreparo || '',
    fotoReceita: null,
    ingredientes: dadosIniciais?.ingredientes || [],
    aceitouLgpd: dadosIniciais?.aceitouLgpd || false,
    autorizouUsoImagem: dadosIniciais?.autorizouUsoImagem || false,
    aceitouTermosUso: dadosIniciais?.aceitouTermosUso || false,
    declarouSemParentesco: dadosIniciais?.declarouSemParentesco || false,
  });

  const update = (field: keyof WizardData, value: unknown) =>
    setData(prev => ({ ...prev, [field]: value }));

  const nextStep = () => {
    setError('');
    // Edital, item 4.5: a receita precisa ser classificada como prato principal e/ou acompanhamento
    if (step === 1 && !data.tipoReceita) {
      setError('Selecione o tipo da receita (Prato Principal e/ou Acompanhamento) antes de continuar.');
      return;
    }
    setStep(s => s + 1);
  };
  const prevStep = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setError('');
    // Edital, itens 4.7, 9.3, 9.4 e 9.11: sem esses aceites a inscrição não é válida
    if (!data.tipoReceita) {
      setError('Selecione o tipo da receita antes de enviar.');
      return;
    }
    if (!data.aceitouLgpd || !data.autorizouUsoImagem || !data.aceitouTermosUso || !data.declarouSemParentesco) {
      setError('É necessário marcar todas as declarações da etapa "Termos" para enviar a inscrição.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      if (data.nomeReceita) formData.append('nomeReceita', data.nomeReceita);
      formData.append('tipoReceita', data.tipoReceita);
      if (data.descricao) formData.append('descricao', data.descricao);
      if (data.modoPreparo) formData.append('modoPreparo', data.modoPreparo);
      formData.append('aceitouLgpd', String(data.aceitouLgpd));
      formData.append('autorizouUsoImagem', String(data.autorizouUsoImagem));
      formData.append('aceitouTermosUso', String(data.aceitouTermosUso));
      formData.append('declarouSemParentesco', String(data.declarouSemParentesco));
      if (data.fotoReceita) formData.append('fotoReceita', data.fotoReceita);
      data.ingredientes.forEach((ing, index) => {
        formData.append(`Ingredientes[${index}].Id`, String(ing.id));
        formData.append(`Ingredientes[${index}].Quantidade`, ing.quantidade);
      });

      if (modoEdicao) {
        if (!inscricaoId) throw new Error('ID da inscrição não informado para edição.');
        await inscricaoApi.atualizar(inscricaoId, formData);
      } else {
        await inscricaoApi.enviar(formData);
      }

      if (onSucesso) {
        onSucesso();
      } else {
        navigate('/minha-inscricao');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string; cadastroIncompleto?: boolean } } };
      if (err.response?.data?.cadastroIncompleto) {
        navigate('/completar-cadastro');
        return;
      }
      setError(err.response?.data?.error || 'Erro ao salvar inscrição.');
    } finally { setLoading(false); }
  };

  const categorias = [...new Set(ingredientes.map(i => i.categoria))].sort();

  const toggleIngrediente = (id: number) => {
    const existe = data.ingredientes.find(i => i.id === id);
    if (existe) {
      update('ingredientes', data.ingredientes.filter(i => i.id !== id));
    } else {
      update('ingredientes', [...data.ingredientes, { id, quantidade: '' }]);
    }
  };

  const updateQuantidade = (id: number, quantidade: string) => {
    update('ingredientes', data.ingredientes.map(i => i.id === id ? { ...i, quantidade } : i));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${i < step ? 'bg-orange-500 text-white' :
                  i === step ? 'bg-orange-600 text-white ring-4 ring-orange-200' :
                  'bg-gray-200 text-gray-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-1 rounded ${i < step ? 'bg-orange-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-orange-700 mt-2">
          Passo {step + 1} de {STEPS.length}: <span className="font-bold">{STEPS[step]}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
        {step === 0 && (
          <StepIngredientes
            ingredientes={ingredientes}
            categorias={categorias}
            selected={data.ingredientes}
            toggle={toggleIngrediente}
            updateQuantidade={updateQuantidade}
          />
        )}
        {step === 1 && <StepReceita data={data} update={update} ingredientes={ingredientes} />}
        {step === 2 && (
          <StepTermos
            data={data}
            update={update}
            onAbrirTermos={() => setModalTermos(true)}
          />
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={prevStep}
              className="flex-1 py-3 border-2 border-orange-300 text-orange-700 rounded-xl font-semibold hover:bg-orange-50 transition">
              ← Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={nextStep}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition shadow">
              Próximo →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition shadow disabled:opacity-50">
              {loading ? 'Salvando...' : modoEdicao ? '💾 Salvar Alterações' : '🏆 Enviar Receita'}
            </button>
          )}
        </div>
      </div>

      {/* Modal Termos */}
      {modalTermos && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">📜 Termos de Uso e Política de Privacidade</h2>
              <button onClick={() => setModalTermos(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{TERMOS_TEXTO}</pre>
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setModalTermos(false)}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FileDropzone({ label, accept, value, onChange, hint }: {
  label: string; accept: string; value: File | null;
  onChange: (f: File | null) => void; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <label className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition block border-gray-300 hover:border-orange-300 hover:bg-orange-50/50">
        <input type="file" accept={accept} className="hidden"
          onChange={e => onChange(e.target.files?.[0] || null)} />
        {value ? (
          <div className="text-green-600 font-medium">✅ {value.name}</div>
        ) : (
          <div className="text-gray-500">
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm">Clique para selecionar o arquivo</p>
            {hint && <p className="text-xs mt-1 text-gray-400">{hint}</p>}
          </div>
        )}
      </label>
    </div>
  );
}

function StepIngredientes({ ingredientes, categorias, selected, toggle, updateQuantidade }: {
  ingredientes: Ingrediente[]; categorias: string[];
  selected: { id: number; quantidade: string }[];
  toggle: (id: number) => void;
  updateQuantidade: (id: number, quantidade: string) => void;
}) {
  const [busca, setBusca] = useState('');
  const filtered = ingredientes.filter(i =>
    i.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">🥕 Ingredientes (Anexo I)</h2>
      <p className="text-sm text-gray-600">
        Selecione os ingredientes do pregão FAETEC e informe a quantidade de cada um.
        <span className="ml-1 text-orange-600 font-semibold">({selected.length} selecionados)</span>
      </p>
      <input type="text" placeholder="🔍 Buscar ingrediente..." value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />

      {selected.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-orange-700 mb-2">✅ Selecionados — informe a quantidade:</p>
          {selected.map(sel => {
            const ing = ingredientes.find(i => i.id === sel.id);
            if (!ing) return null;
            return (
              <div key={sel.id} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-gray-800 font-medium">{ing.nome}</span>
                <input type="text" placeholder={`Qtd (${ing.unidadeMedida})`}
                  value={sel.quantidade} onChange={e => updateQuantidade(sel.id, e.target.value)}
                  className="w-32 border border-orange-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
                <button onClick={() => toggle(sel.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">✕</button>
              </div>
            );
          })}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {categorias.map(cat => {
          const items = filtered.filter(i => i.categoria === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white py-1">{cat}</h3>
              <div className="grid gap-1">
                {items.map(ing => {
                  const isSelected = selected.some(s => s.id === ing.id);
                  return (
                    <label key={ing.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition
                        ${isSelected ? 'bg-orange-50 border border-orange-300' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(ing.id)}
                        className="accent-orange-500 w-4 h-4" />
                      <span className="flex-1 text-sm text-gray-800">{ing.nome}</span>
                      <span className="text-xs text-gray-400">{ing.unidadeMedida}</span>
                      {ing.isInNatura && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">In Natura</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepReceita({ data, update, ingredientes }: {
  data: WizardData;
  update: (k: keyof WizardData, v: unknown) => void;
  ingredientes: Ingrediente[];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">🍽️ Sua Receita</h2>

      {/* Ingredientes selecionados */}
      {data.ingredientes.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-bold text-green-700 mb-2">🥕 Ingredientes selecionados ({data.ingredientes.length}):</p>
          <div className="flex flex-wrap gap-2">
            {data.ingredientes.map(sel => {
              const ing = ingredientes.find(i => i.id === sel.id);
              if (!ing) return null;
              return (
                <span key={sel.id} className={`text-xs px-2 py-1 rounded-full border
                  ${ing.isInNatura ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                  {ing.nome}{sel.quantidade ? ` — ${sel.quantidade}` : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Receita</label>
        <input type="text" placeholder="Ex: Feijoada Carioca da Vovó"
          value={data.nomeReceita} onChange={e => update('nomeReceita', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Tipo da Receita <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Conforme o Edital, a receita deve ser um prato principal e/ou acompanhamento apto à alimentação escolar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.entries(TIPO_RECEITA_LABEL) as [TipoReceita, string][]).map(([value, label]) => (
            <label key={value} className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer text-sm transition
              ${data.tipoReceita === value ? 'border-orange-400 bg-orange-50 font-semibold text-orange-700' : 'border-gray-200 hover:border-orange-200 text-gray-700'}`}>
              <input type="radio" name="tipoReceita" value={value} checked={data.tipoReceita === value}
                onChange={() => update('tipoReceita', value)} className="accent-orange-500" />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição do Prato</label>
        <textarea rows={4} placeholder="Descreva seu prato, origem cultural, curiosidades..."
          value={data.descricao} onChange={e => update('descricao', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Modo de Preparo</label>
        <textarea rows={6} placeholder="Descreva passo a passo como preparar a receita..."
          value={data.modoPreparo} onChange={e => update('modoPreparo', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
        <p className="text-xs text-gray-400 mt-1">{data.modoPreparo.length} caracteres</p>
      </div>
      <FileDropzone
        label="Foto do Prato (opcional)"
        accept=".jpg,.jpeg,.png"
        value={data.fotoReceita}
        onChange={f => update('fotoReceita', f)}
        hint="JPG ou PNG — máx. 5MB"
      />
    </div>
  );
}

function StepTermos({ data, update, onAbrirTermos }: {
  data: WizardData;
  update: (k: keyof WizardData, v: unknown) => void;
  onAbrirTermos: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">📜 Termos e Autorização</h2>
      <div className="space-y-3">
        <label className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition
          ${data.aceitouLgpd ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
          <input type="checkbox" checked={data.aceitouLgpd}
            onChange={e => update('aceitouLgpd', e.target.checked)}
            className="accent-orange-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Termo de Uso e LGPD</p>
            <p className="text-sm text-gray-600 mt-1">
              Declaro que li e concordo com os termos de uso e autorizo o tratamento dos meus dados pessoais pela FAETEC conforme a Lei nº 13.709/2018 (LGPD).
            </p>
          </div>
        </label>

        <label className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition
          ${data.autorizouUsoImagem ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
          <input type="checkbox" checked={data.autorizouUsoImagem}
            onChange={e => update('autorizouUsoImagem', e.target.checked)}
            className="accent-orange-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Autorização de Uso de Imagem, Voz e Cessão de Direitos Autorais</p>
            <p className="text-sm text-gray-600 mt-1">
              Autorizo, gratuitamente e em caráter exclusivo, irrevogável, irretratável, definitivo e universal, a divulgação
              do meu nome, imagem, voz e da receita/prato enviados, e cedo à FAETEC os direitos autorais patrimoniais
              decorrentes da minha participação, nos termos do art. 93 da Lei nº 14.133/2021 (
              <button type="button" onClick={e => { e.preventDefault(); onAbrirTermos(); }}
                className="text-orange-600 underline font-semibold hover:text-orange-700">
                ver detalhes completos
              </button>
              ).
            </p>
          </div>
        </label>

        <label className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition
          ${data.aceitouTermosUso ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
          <input type="checkbox" checked={data.aceitouTermosUso}
            onChange={e => update('aceitouTermosUso', e.target.checked)}
            className="accent-orange-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Termos de Uso Completos</p>
            <p className="text-sm text-gray-600 mt-1">
              Li e aceito os{' '}
              <button type="button" onClick={e => { e.preventDefault(); onAbrirTermos(); }}
                className="text-orange-600 underline font-semibold hover:text-orange-700">
                Termos de Uso completos
              </button>
              {' '}e autorizo o uso anonimizado dos meus dados para fins de pesquisa científica da FAETEC.
            </p>
          </div>
        </label>

        <label className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition
          ${data.declarouSemParentesco ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
          <input type="checkbox" checked={data.declarouSemParentesco}
            onChange={e => update('declarouSemParentesco', e.target.checked)}
            className="accent-orange-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Declaração de Ausência de Parentesco</p>
            <p className="text-sm text-gray-600 mt-1">
              Declaro, sob as penas da lei, que não sou cônjuge, ascendente, descendente ou parente até o 2º grau de
              colaboradores/funcionários da FAETEC vinculados à organização do Concurso, nem de membros das
              Comissões Julgadoras.
            </p>
          </div>
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        💡 <strong>Lembrete:</strong> Você pode salvar agora e editar sua receita depois, enquanto o prazo estiver aberto.
      </div>
    </div>
  );
}
