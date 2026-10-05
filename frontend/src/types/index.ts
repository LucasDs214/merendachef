// types/index.ts
export interface Candidato {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  primeiroAcesso: boolean;
}

export interface Ingrediente {
  id: number;
  nome: string;
  categoria: string;
  isInNatura: boolean;
  unidadeMedida: string;
}

// Edital, item 4.5
export type TipoReceita = 'PratoPrincipal' | 'Acompanhamento' | 'PratoPrincipalEAcompanhamento';

export const TIPO_RECEITA_LABEL: Record<TipoReceita, string> = {
  PratoPrincipal: 'Prato Principal',
  Acompanhamento: 'Acompanhamento',
  PratoPrincipalEAcompanhamento: 'Prato Principal + Acompanhamento',
};

// Dados funcionais + comprovante — preenchidos uma única vez em /completar-cadastro,
// não fazem mais parte do wizard de receita.
export interface PerfilData {
  unidadeEscolar: string;
  nomeDiretor: string;
  matricula: string;
  cargo: string;
  telefone: string;
  comprovanteVinculo: File | null;
}

export interface WizardData {
  nomeReceita: string;
  tipoReceita: TipoReceita | '';
  descricao: string;
  modoPreparo: string;
  fotoReceita: File | null;
  ingredientes: { id: number; quantidade: string }[];
  aceitouLgpd: boolean;
  autorizouUsoImagem: boolean;
  aceitouTermosUso: boolean;
  declarouSemParentesco: boolean;
}

export interface InscricaoAdmin {
  id: string;
  candidato: {
    id: string; nome: string; cpf: string; email: string;
    unidade: string; diretor: string; matricula: string; cargo: string; comprovante: string;
  };
  receita: { nome: string; tipo: TipoReceita | ''; descricao: string; foto?: string };
  ingredientes: Array<{ id: number; nome: string; categoria: string; isInNatura: boolean }>;
  status: 'Pendente' | 'Habilitada' | 'Eliminada';
  motivoEliminacao?: string;
  notas: {
    viabilidade?: number; criatividade?: number;
    culturaRegional?: number; alimentosInNatura?: number; total?: number;
  };
  criadaEm: string;
}

export interface RankingItem {
  posicao: number;
  candidato: string;
  nomeReceita: string;
  notas: { viabilidade: number; criatividade: number; culturaRegional: number; alimentosInNatura: number; total: number };
}