/**
 * seed.js — Injeta clientes de exemplo no banco SQLite da clínica
 * Execute com: node seed.js
 */
const Database = require('better-sqlite3');
const path = require('path');
const os   = require('os');

// Caminho padrão do userData no Electron (Linux/Windows/Mac)
const platform = process.platform;
let userData;
if (platform === 'win32') {
  userData = path.join(process.env.APPDATA, 'clinica-estetica');
} else if (platform === 'darwin') {
  userData = path.join(os.homedir(), 'Library', 'Application Support', 'clinica-estetica');
} else {
  userData = path.join(os.homedir(), '.config', 'clinica-estetica');
}

const dbPath = path.join(userData, 'clinica.db');
console.log('📂 Banco:', dbPath);

const db = new Database(dbPath);

const clientes = [
  {
    nome: 'Ana Carolina Ferreira',
    data_nascimento: '1995-03-14',
    cpf: '123.456.789-00',
    email: 'ana.carolina@gmail.com',
    telefone: '(62) 3201-1234',
    celular: '(62) 99801-2345',
    endereco: 'Rua das Flores, 142 - Setor Bueno',
    cidade: 'Goiânia',
    uf: 'GO',
    areas_tratar: 'Virilha, axilas, pernas completas',
    metodo_dep_cera: 1, metodo_dep_lamina: 0, metodo_dep_laser: 0,
    prob_encravamento: 1, prob_manchas: 1, prob_outros: null,
    medicamento_uso: 0, medicamento_qual: null,
    roacutan: 0, tto_vitiligo: 0,
    alergia_medicamento: 0, alergia_qual: null,
    tratamento_dermato: 1, tratamento_dermato_qual: 'Peeling de ácido glicólico',
    usa_acidos: 1,
    cirurgia: 0, cirurgia_qual: null,
    anticoncepcional: 1, anticoncepcional_qual: 'Yasmin',
    historico_oncologico: 0, oncologico_qual: null,
    acompanhamento_medico: 0, acompanhamento_qual: null,
    epilepsia: 0,
    alteracao_hormonal: 0, hormonal_qual: null,
    hirsutismo: 0, gestante: 0, herpes: 0, lactante: 0,
    cor_olhos: 'Castanhos', cor_cabelos: 'Castanhos escuros', cor_pelos: 'Negros',
    tomou_sol: 1, sol_quando: 'Há 15 dias',
    fitzpatrick: 3,
    termo_assinado: 1,
    observacoes: 'Cliente assídua, prefere sessões às terças de manhã'
  },
  {
    nome: 'Beatriz Souza Lima',
    data_nascimento: '1990-07-22',
    cpf: '234.567.890-11',
    email: 'beatriz.lima@hotmail.com',
    telefone: null,
    celular: '(62) 98723-4567',
    endereco: 'Av. T-3, 890 - Setor Marista',
    cidade: 'Goiânia',
    uf: 'GO',
    areas_tratar: 'Buço, sobrancelha, rosto completo',
    metodo_dep_cera: 1, metodo_dep_lamina: 1, metodo_dep_laser: 0,
    prob_encravamento: 0, prob_manchas: 1, prob_outros: 'Sensibilidade na pele',
    medicamento_uso: 1, medicamento_qual: 'Levotiroxina 50mcg',
    roacutan: 0, tto_vitiligo: 0,
    alergia_medicamento: 1, alergia_qual: 'Dipirona',
    tratamento_dermato: 0, tratamento_dermato_qual: null,
    usa_acidos: 0,
    cirurgia: 1, cirurgia_qual: 'Rinoplastia (2019)',
    anticoncepcional: 0, anticoncepcional_qual: null,
    historico_oncologico: 0, oncologico_qual: null,
    acompanhamento_medico: 1, acompanhamento_qual: 'Endocrinologista — hipotireoidismo',
    epilepsia: 0,
    alteracao_hormonal: 1, hormonal_qual: 'Hipotireoidismo',
    hirsutismo: 1, gestante: 0, herpes: 0, lactante: 0,
    cor_olhos: 'Verdes', cor_cabelos: 'Loiros tingidos', cor_pelos: 'Castanhos',
    tomou_sol: 0, sol_quando: null,
    fitzpatrick: 2,
    termo_assinado: 1,
    observacoes: 'Pele sensível, usar configuração mais baixa no laser'
  },
  {
    nome: 'Camila Rocha Mendes',
    data_nascimento: '2001-11-05',
    cpf: '345.678.901-22',
    email: 'camila.mendes@gmail.com',
    telefone: null,
    celular: '(62) 99934-5678',
    endereco: 'Rua 88, 340 - Setor Sul',
    cidade: 'Goiânia',
    uf: 'GO',
    areas_tratar: 'Braços, pernas, virilha',
    metodo_dep_cera: 0, metodo_dep_lamina: 1, metodo_dep_laser: 0,
    prob_encravamento: 1, prob_manchas: 0, prob_outros: null,
    medicamento_uso: 0, medicamento_qual: null,
    roacutan: 0, tto_vitiligo: 0,
    alergia_medicamento: 0, alergia_qual: null,
    tratamento_dermato: 0, tratamento_dermato_qual: null,
    usa_acidos: 0,
    cirurgia: 0, cirurgia_qual: null,
    anticoncepcional: 1, anticoncepcional_qual: 'NuvaRing',
    historico_oncologico: 0, oncologico_qual: null,
    acompanhamento_medico: 0, acompanhamento_qual: null,
    epilepsia: 0,
    alteracao_hormonal: 0, hormonal_qual: null,
    hirsutismo: 0, gestante: 0, herpes: 0, lactante: 0,
    cor_olhos: 'Castanhos', cor_cabelos: 'Pretos', cor_pelos: 'Negros',
    tomou_sol: 1, sol_quando: 'Ontem (praia)',
    fitzpatrick: 4,
    termo_assinado: 1,
    observacoes: 'Primeira vez com laser. Conversar sobre expectativas.'
  },
  {
    nome: 'Daniela Alves Cardoso',
    data_nascimento: '1985-01-30',
    cpf: '456.789.012-33',
    email: 'daniela.cardoso@yahoo.com.br',
    telefone: '(62) 3301-9876',
    celular: '(62) 99145-6789',
    endereco: 'Rua C-149, 55 - Jardim América',
    cidade: 'Goiânia',
    uf: 'GO',
    areas_tratar: 'Axilas, bikini completo',
    metodo_dep_cera: 0, metodo_dep_lamina: 0, metodo_dep_laser: 1,
    prob_encravamento: 0, prob_manchas: 0, prob_outros: null,
    medicamento_uso: 1, medicamento_qual: 'Omeprazol 20mg',
    roacutan: 0, tto_vitiligo: 0,
    alergia_medicamento: 0, alergia_qual: null,
    tratamento_dermato: 1, tratamento_dermato_qual: 'Botox preventivo',
    usa_acidos: 1,
    cirurgia: 1, cirurgia_qual: 'Lipoaspiração abdominal (2022)',
    anticoncepcional: 0, anticoncepcional_qual: null,
    historico_oncologico: 0, oncologico_qual: null,
    acompanhamento_medico: 0, acompanhamento_qual: null,
    epilepsia: 0,
    alteracao_hormonal: 0, hormonal_qual: null,
    hirsutismo: 0, gestante: 0, herpes: 1, lactante: 0,
    cor_olhos: 'Azuis', cor_cabelos: 'Loiros naturais', cor_pelos: 'Castanhos claros',
    tomou_sol: 0, sol_quando: null,
    fitzpatrick: 1,
    termo_assinado: 1,
    observacoes: 'Histórico de herpes — verificar protocolo antes de sessão'
  },
  {
    nome: 'Fernanda Costa Ribeiro',
    data_nascimento: '1998-05-18',
    cpf: '567.890.123-44',
    email: 'fernanda.ribeiro@gmail.com',
    telefone: null,
    celular: '(62) 99267-8901',
    endereco: 'Rua 10, 120 - Setor Oeste',
    cidade: 'Goiânia',
    uf: 'GO',
    areas_tratar: 'Pernas completas, virilha, abdômen',
    metodo_dep_cera: 1, metodo_dep_lamina: 1, metodo_dep_laser: 0,
    prob_encravamento: 1, prob_manchas: 1, prob_outros: 'Foliculite recorrente',
    medicamento_uso: 0, medicamento_qual: null,
    roacutan: 0, tto_vitiligo: 0,
    alergia_medicamento: 0, alergia_qual: null,
    tratamento_dermato: 0, tratamento_dermato_qual: null,
    usa_acidos: 0,
    cirurgia: 0, cirurgia_qual: null,
    anticoncepcional: 1, anticoncepcional_qual: 'DIU hormonal (Mirena)',
    historico_oncologico: 0, oncologico_qual: null,
    acompanhamento_medico: 0, acompanhamento_qual: null,
    epilepsia: 0,
    alteracao_hormonal: 0, hormonal_qual: null,
    hirsutismo: 0, gestante: 0, herpes: 0, lactante: 0,
    cor_olhos: 'Castanhos escuros', cor_cabelos: 'Pretos com mechas', cor_pelos: 'Negros',
    tomou_sol: 0, sol_quando: null,
    fitzpatrick: 5,
    termo_assinado: 1,
    observacoes: 'Pele escura tipo V — atenção ao protocolo de energia do equipamento'
  }
];

const fields = [
  'nome','data_nascimento','cpf','email','telefone','celular','endereco','cidade','uf',
  'areas_tratar','metodo_dep_cera','metodo_dep_lamina','metodo_dep_laser',
  'prob_encravamento','prob_manchas','prob_outros',
  'medicamento_uso','medicamento_qual','roacutan','tto_vitiligo',
  'alergia_medicamento','alergia_qual',
  'tratamento_dermato','tratamento_dermato_qual','usa_acidos',
  'cirurgia','cirurgia_qual',
  'anticoncepcional','anticoncepcional_qual',
  'historico_oncologico','oncologico_qual',
  'acompanhamento_medico','acompanhamento_qual',
  'epilepsia','alteracao_hormonal','hormonal_qual','hirsutismo',
  'gestante','herpes','lactante',
  'cor_olhos','cor_cabelos','cor_pelos',
  'tomou_sol','sol_quando','fitzpatrick',
  'termo_assinado','observacoes'
];

const cols = fields.join(',');
const phs  = fields.map(() => '?').join(',');
const stmt = db.prepare(`INSERT INTO clientes (${cols}) VALUES (${phs})`);

let inseridos = 0;
for (const c of clientes) {
  try {
    stmt.run(...fields.map(f => c[f] !== undefined ? c[f] : null));
    console.log(`✅ ${c.nome}`);
    inseridos++;
  } catch(e) {
    console.error(`❌ ${c.nome}:`, e.message);
  }
}

console.log(`\n🎉 ${inseridos}/${clientes.length} clientes inseridos com sucesso!`);
db.close();
