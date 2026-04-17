-- ============================================================
-- SEED COMPLETO: procedimentos + 20 clientes + 35 agendamentos
-- Uso: sqlite3 ~/.config/clinica-estetica/clinica.db < seed-full.sql
-- ============================================================

-- ── PROCEDIMENTOS ───────────────────────────────────────────
INSERT INTO procedimentos (nome, descricao, duracao_min, valor, ativo) VALUES
('Laser Axilas',           'Depilação a laser região axilar',              30,  180.00, 1),
('Laser Virilha Completa', 'Depilação a laser virilha completa',           45,  250.00, 1),
('Laser Pernas Completas', 'Depilação a laser pernas inteiras',            90,  420.00, 1),
('Laser Buço',             'Depilação a laser lábio superior',             20,  120.00, 1),
('Laser Rosto Completo',   'Depilação a laser rosto inteiro',              40,  280.00, 1),
('Laser Braços',           'Depilação a laser braços completos',           60,  320.00, 1),
('Peeling Químico',        'Peeling com ácidos para renovação celular',    50,  350.00, 1),
('Limpeza de Pele',        'Limpeza profunda com extração',                60,  200.00, 1);

-- ── CLIENTES ────────────────────────────────────────────────
INSERT INTO clientes (nome,data_nascimento,cpf,email,telefone,celular,endereco,cidade,uf,areas_tratar,metodo_dep_cera,metodo_dep_lamina,metodo_dep_laser,prob_encravamento,prob_manchas,prob_outros,medicamento_uso,medicamento_qual,roacutan,tto_vitiligo,alergia_medicamento,alergia_qual,tratamento_dermato,tratamento_dermato_qual,usa_acidos,cirurgia,cirurgia_qual,anticoncepcional,anticoncepcional_qual,historico_oncologico,oncologico_qual,acompanhamento_medico,acompanhamento_qual,epilepsia,alteracao_hormonal,hormonal_qual,hirsutismo,gestante,herpes,lactante,cor_olhos,cor_cabelos,cor_pelos,tomou_sol,sol_quando,fitzpatrick,termo_assinado,observacoes) VALUES
('Ana Carolina Ferreira','1995-03-14','123.456.789-00','ana.carolina@gmail.com','(62) 3201-1234','(62) 99801-2345','Rua das Flores, 142 - Setor Bueno','Goiânia','GO','Virilha, axilas, pernas',1,0,1,1,1,NULL,0,NULL,0,0,0,NULL,1,'Peeling glicólico',1,0,NULL,1,'Yasmin',0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Castanhos','Castanhos escuros','Negros',1,'Há 15 dias',3,1,'Preferência por sessões às terças de manhã'),
('Beatriz Souza Lima','1990-07-22','234.567.890-11','beatriz.lima@hotmail.com',NULL,'(62) 98723-4567','Av. T-3, 890 - Setor Marista','Goiânia','GO','Buço, sobrancelha, rosto',1,1,0,0,1,'Sensibilidade',1,'Levotiroxina 50mcg',0,0,1,'Dipirona',0,NULL,0,1,'Rinoplastia (2019)',0,NULL,0,NULL,1,'Endocrinologista',0,1,'Hipotireoidismo',1,0,0,0,'Verdes','Loiros tingidos','Castanhos',0,NULL,2,1,'Pele sensível, usar energia baixa'),
('Camila Rocha Mendes','2001-11-05','345.678.901-22','camila.mendes@gmail.com',NULL,'(62) 99934-5678','Rua 88, 340 - Setor Sul','Goiânia','GO','Braços, pernas, virilha',0,1,0,1,0,NULL,0,NULL,0,0,0,NULL,0,NULL,0,0,NULL,1,'NuvaRing',0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Castanhos','Pretos','Negros',1,'Ontem',4,1,'Primeira vez com laser'),
('Daniela Alves Cardoso','1985-01-30','456.789.012-33','daniela.cardoso@yahoo.com.br','(62) 3301-9876','(62) 99145-6789','Rua C-149, 55 - Jardim América','Goiânia','GO','Axilas, bikini completo',0,0,1,0,0,NULL,1,'Omeprazol 20mg',0,0,0,NULL,1,'Botox preventivo',1,1,'Lipoaspiração (2022)',0,NULL,0,NULL,0,NULL,0,0,NULL,0,0,1,0,'Azuis','Loiros naturais','Castanhos claros',0,NULL,1,1,'Histórico de herpes — verificar protocolo'),
('Fernanda Costa Ribeiro','1998-05-18','567.890.123-44','fernanda.ribeiro@gmail.com',NULL,'(62) 99267-8901','Rua 10, 120 - Setor Oeste','Goiânia','GO','Pernas, virilha, abdômen',1,1,0,1,1,'Foliculite',0,NULL,0,0,0,NULL,0,NULL,0,0,NULL,1,'DIU Mirena',0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Castanhos escuros','Pretos com mechas','Negros',0,NULL,5,1,'Pele tipo V — atenção ao protocolo'),
('Gabriela Martins Teixeira','1993-08-27','678.901.234-55','gabi.teixeira@gmail.com','(62) 3322-5544','(62) 99312-6789','Rua 1025, 77 - Setor Pedro Ludovico','Goiânia','GO','Axilas, pernas',1,0,1,0,1,NULL,0,NULL,0,0,0,NULL,1,'Vitamina C tópica',1,0,NULL,1,'Anticoncepcional oral',0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Castanhos','Castanhos','Castanhos',1,'Semana passada',3,1,'Faz uso regular de protetor solar'),
('Helena Vieira Nascimento','1988-12-03','789.012.345-66','helena.nascimento@outlook.com','(62) 3411-2233','(62) 98845-7890','Av. Anhanguera, 5500 - St. Universitário','Goiânia','GO','Rosto, buço',0,0,1,0,0,NULL,1,'Metformina 850mg',0,0,0,NULL,1,'Ácido retinóico',1,0,NULL,0,NULL,0,NULL,1,'Endocrinologista',0,1,'SOP',1,0,0,0,'Pretos','Pretos','Negros',0,NULL,4,1,'SOP — hirsutismo moderado, aguardar 3 meses de tratamento'),
('Isabela Ferraz Duarte','2000-04-16','890.123.456-77','isa.duarte@gmail.com',NULL,'(62) 99456-8901','Rua 230, 410 - Jardim Goiás','Goiânia','GO','Virilha, axilas',1,1,0,1,0,NULL,0,NULL,0,0,0,NULL,0,NULL,0,0,NULL,1,'Implanon',0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Mel','Castanhos claros','Castanhos',1,'Há 1 mês',2,1,'Pele clara, responde bem ao laser'),
('Juliana Prado Cavalcanti','1996-09-11','901.234.567-88','juliana.prado@gmail.com','(62) 3500-1122','(62) 99578-9012','Rua T-55, 980 - Setor Bueno','Goiânia','GO','Pernas completas',0,0,1,1,1,NULL,0,NULL,0,0,0,NULL,0,NULL,0,1,'Cesariana (2021)',0,NULL,0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Verdes','Loiros','Castanhos claros',0,NULL,2,1,'Pós-parto 8 meses, pele normalizada'),
('Karen Oliveira Santos','1983-06-25','012.345.678-99','karen.santos@hotmail.com','(62) 3611-3344','(62) 98690-0123','Rua 9, 200 - Setor Marista','Goiânia','GO','Braços, costas',0,1,1,0,1,NULL,1,'Losartana 50mg',0,0,0,NULL,0,NULL,0,0,NULL,0,NULL,0,NULL,1,'Cardiologista',0,0,NULL,0,0,0,0,'Castanhos escuros','Pretos','Negros',1,'Hoje cedo',5,1,'Pressão controlada — liberdade médica confirmada'),
('Larissa Campos Borges','1997-02-08','111.222.333-44','larissa.borges@gmail.com',NULL,'(62) 99701-1234','Rua 3, 550 - Alto da Glória','Goiânia','GO','Axilas, virilha',1,0,1,0,0,NULL,0,NULL,0,0,0,NULL,0,NULL,0,0,NULL,1,'Anticoncepcional oral',0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Azuis','Loiros','Loiros',0,NULL,1,1,'Pele fotossensível tipo I'),
('Mariana Lima Freitas','1994-10-19','222.333.444-55','mari.freitas@gmail.com','(62) 3700-2233','(62) 99812-2345','Av. 85, 1500 - Setor Sul','Goiânia','GO','Pernas, virilha, axilas',1,1,1,1,1,'Pele reativa',0,NULL,0,0,0,NULL,1,'Tretinoína 0.05%',1,0,NULL,1,'Diane 35',0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Castanhos','Castanhos','Castanhos',1,'Há 3 semanas',3,1,'Faz uso de tretinoína — pausar 2 sem antes'),
('Natália Rocha Almeida','1991-07-04','333.444.555-66','natalia.almeida@yahoo.com.br',NULL,'(62) 98923-3456','Rua 26, 890 - Setor Leste Universitário','Goiânia','GO','Rosto, buço, pescoço',0,0,1,0,1,NULL,1,'Clonazepam 0.5mg',0,0,0,NULL,0,NULL,0,0,NULL,0,NULL,0,NULL,1,'Psiquiatra',1,0,NULL,0,0,0,0,'Castanhos','Pretos','Negros',0,NULL,4,1,'Ansiedade controlada, sem contraindicação para laser'),
('Patrícia Mendes Gomes','1979-03-22','444.555.666-77','patricia.gomes@gmail.com','(62) 3800-3344','(62) 99034-4567','Rua 111, 330 - Jardim América','Goiânia','GO','Braços, costas, axilas',0,0,1,0,0,NULL,0,NULL,0,0,0,NULL,1,'Peeling enzimático',0,1,'Abdominoplastia (2020)',0,NULL,0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Verdes','Castanhos','Castanhos',0,NULL,2,1,'Cicatriz pós-cirúrgica na região abdominal'),
('Renata Dias Barbosa','2002-11-30','555.666.777-88','renata.barbosa@gmail.com',NULL,'(62) 99145-5678','Rua 44, 120 - Nova Vila','Goiânia','GO','Axilas, virilha',1,0,0,1,0,NULL,0,NULL,0,0,0,NULL,0,NULL,0,0,NULL,1,'Anticoncepcional injetável',0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Pretos','Pretos','Negros',1,'Ontem tarde',5,1,'Jovem, primeira consulta'),
('Sabrina Lopes Moreira','1986-05-14','666.777.888-99','sabrina.moreira@outlook.com','(62) 3900-4455','(62) 98256-6789','Av. Mutirão, 2200 - St. Negrão de Lima','Goiânia','GO','Pernas, buço',1,1,0,0,1,NULL,1,'Escitalopram 10mg',0,0,0,NULL,0,NULL,0,0,NULL,0,NULL,0,NULL,1,'Psiquiatra',0,0,NULL,0,0,0,0,'Castanhos','Loiros tingidos','Castanhos claros',0,NULL,2,1,'Depressão controlada — sem contraindicação'),
('Tatiana Correia Fonseca','1999-08-07','777.888.999-00','tati.fonseca@gmail.com',NULL,'(62) 99367-7890','Rua 149, 640 - Setor Pedro Ludovico','Goiânia','GO','Virilha, axilas, pernas',0,1,1,1,0,NULL,0,NULL,0,0,0,NULL,0,NULL,0,0,NULL,1,'Yasmin',0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Mel','Castanhos','Castanhos',1,'Há 10 dias',3,1,'Boa resposta nas sessões anteriores'),
('Ursula Albuquerque Mota','1992-01-18','888.999.000-11','ursula.mota@gmail.com','(62) 3111-5566','(62) 99478-8901','Rua 22, 780 - Setor Oeste','Goiânia','GO','Rosto completo, pescoço',0,0,1,0,1,'Rosácea leve',1,'Doxiciclina 100mg',0,0,0,NULL,1,'Tratamento rosácea',1,0,NULL,0,NULL,0,NULL,1,'Dermatologista',0,0,NULL,0,0,0,0,'Azuis','Loiros','Loiros claros',0,NULL,1,1,'Rosácea — protocolo específico requerido'),
('Vanessa Teles Carvalho','1987-09-29','999.000.111-22','vanessa.carvalho@hotmail.com','(62) 3222-6677','(62) 98589-9012','Rua 101, 45 - Setor Bueno','Goiânia','GO','Axilas, braços, pernas',1,0,1,0,1,NULL,0,NULL,0,0,1,'AAS',0,NULL,0,1,'Mamoplastia (2018)',0,NULL,0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Castanhos escuros','Pretos','Negros',1,'Há 1 semana',4,1,'Alergia a AAS — não usar produtos com salicilatos'),
('Wanessa Borba Pimentel','2003-06-12','000.111.222-33','wanessa.pimentel@gmail.com',NULL,'(62) 99690-0123','Rua 88, 210 - Setor Sul','Goiânia','GO','Buço, axilas',1,1,0,0,0,NULL,0,NULL,0,0,0,NULL,0,NULL,0,0,NULL,0,NULL,0,NULL,0,NULL,0,0,NULL,0,0,0,0,'Castanhos','Castanhos','Castanhos',0,NULL,3,1,'Menor de idade — responsável presente na consulta');

-- ── AGENDAMENTOS ────────────────────────────────────────────
INSERT INTO agendamentos (cliente_id, procedimento_id, data_hora, status, valor_cobrado, observacoes) VALUES
(1,  1, '2026-04-18 09:00', 'agendado',   180.00, 'Sessão 3 de 6'),
(1,  3, '2026-04-25 09:00', 'agendado',   420.00, 'Sessão 1 de 6 — pernas'),
(2,  4, '2026-04-18 10:00', 'agendado',   120.00, 'Retorno — avaliar resposta'),
(2,  5, '2026-04-22 14:00', 'agendado',   280.00, 'Primeira sessão rosto'),
(3,  6, '2026-04-19 11:00', 'agendado',   320.00, 'Sessão 2 de 6'),
(3,  2, '2026-04-21 15:00', 'agendado',   250.00, 'Sessão 1 de 6'),
(4,  1, '2026-04-17 08:00', 'concluido',  180.00, 'Concluído sem intercorrências'),
(4,  2, '2026-04-17 08:45', 'concluido',  250.00, 'Concluído — boa tolerância'),
(5,  3, '2026-04-20 16:00', 'agendado',   420.00, 'Sessão 4 de 6'),
(5,  7, '2026-04-23 10:00', 'agendado',   350.00, 'Peeling médio'),
(6,  1, '2026-04-16 09:30', 'concluido',  180.00, NULL),
(6,  8, '2026-04-24 11:00', 'agendado',   200.00, 'Limpeza pré-laser'),
(7,  4, '2026-04-15 10:00', 'concluido',  120.00, 'Boa resposta'),
(7,  5, '2026-04-29 14:30', 'agendado',   280.00, 'Sessão 3 de 6'),
(8,  2, '2026-04-18 13:00', 'agendado',   250.00, 'Sessão 2 de 6'),
(8,  1, '2026-04-26 09:00', 'agendado',   180.00, 'Sessão 2 de 6 axilas'),
(9,  3, '2026-04-14 15:00', 'concluido',  420.00, 'Sessão 5 — quase finalizado'),
(9,  3, '2026-05-05 15:00', 'agendado',   420.00, 'Sessão 6 — última'),
(10, 6, '2026-04-17 16:00', 'cancelado',  NULL,   'Cliente cancelou por viagem'),
(10, 6, '2026-04-28 16:00', 'agendado',   320.00, 'Reagendamento'),
(11, 1, '2026-04-19 08:00', 'agendado',   180.00, 'Sessão 1 de 6'),
(11, 2, '2026-04-19 08:35', 'agendado',   250.00, 'Sessão 1 de 6 virilha'),
(12, 7, '2026-04-16 10:00', 'concluido',  350.00, 'Peeling superficial'),
(12, 8, '2026-04-30 10:00', 'agendado',   200.00, NULL),
(13, 5, '2026-04-22 09:00', 'agendado',   280.00, 'Primeira sessão'),
(14, 6, '2026-04-18 14:00', 'agendado',   320.00, 'Evitar área da cicatriz'),
(15, 1, '2026-04-17 11:00', 'cancelado',  NULL,   'Não compareceu'),
(15, 1, '2026-05-02 11:00', 'agendado',   180.00, 'Reagendamento após falta'),
(16, 4, '2026-04-21 09:00', 'agendado',   120.00, 'Avaliar rosácea antes'),
(17, 3, '2026-04-25 14:00', 'agendado',   420.00, 'Sessão 3 de 6'),
(17, 1, '2026-04-25 15:30', 'agendado',   180.00, 'Sessão 3 axilas'),
(18, 2, '2026-04-23 13:00', 'agendado',   250.00, 'Sessão 4 de 6'),
(19, 8, '2026-04-16 09:00', 'concluido',  200.00, 'Limpeza pré-laser'),
(19, 3, '2026-05-07 09:00', 'agendado',   420.00, 'Sessão 1 de 6 pernas'),
(20, 4, '2026-04-24 10:00', 'agendado',   120.00, 'Primeira sessão buço');