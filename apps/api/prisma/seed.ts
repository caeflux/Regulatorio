import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================
  // OBRIGAÇÕES REGULATÓRIAS ANATEL
  // ============================================
  const obligations = [
    {
      nome: 'DICI Mensal — Coleta de Dados de Acessos',
      tipo: 'DICI_MENSAL' as const,
      frequencia: 'MENSAL' as const,
      prazoDia: 15,
      prazoRegra: 'DIA_CORRIDO' as const,
      descricao: 'Envio mensal de dados de acessos SCM/STFC ao sistema Coleta de Dados ANATEL. Formato: CSV UTF-8 BOM com delimitador CRLF. Dados: CNPJ, município IBGE, tipo acesso, tecnologia, velocidades, quantidade, zona.',
      fundamentacaoLegal: 'Resolução ANATEL — Sistema DICI (substitui SICI desde 2021)',
    },
    {
      nome: 'FUST — Contribuição Mensal',
      tipo: 'FUST' as const,
      frequencia: 'MENSAL' as const,
      prazoDia: 10,
      prazoRegra: 'DIA_CORRIDO' as const,
      descricao: 'Contribuição de 1% sobre receita operacional bruta (deduzidos ICMS, PIS/COFINS) ao Fundo de Universalização dos Serviços de Telecomunicações.',
      fundamentacaoLegal: 'Lei nº 9.998/2000',
    },
    {
      nome: 'FUNTTEL — Contribuição Mensal',
      tipo: 'FUNTTEL' as const,
      frequencia: 'MENSAL' as const,
      prazoDia: 0, // último dia útil
      prazoRegra: 'ULTIMO_DIA_UTIL' as const,
      descricao: 'Contribuição de 0,5% sobre receita bruta (deduzidos vendas canceladas, descontos, ICMS, PIS, COFINS) ao Fundo para o Desenvolvimento Tecnológico das Telecomunicações.',
      fundamentacaoLegal: 'Lei nº 10.052/2000',
    },
    {
      nome: 'Coleta Anual de Dados',
      tipo: 'COLETA_ANUAL' as const,
      frequencia: 'ANUAL' as const,
      prazoDia: 31, // 31 de março
      prazoRegra: 'DIA_CORRIDO' as const,
      descricao: 'Relatório anual mais complexo enviado à ANATEL. Inclui dados econômicos, infraestrutura, backbone, backhaul, estações e enlaces. Prazo: 31 de março.',
      fundamentacaoLegal: 'Resolução ANATEL — Coleta de Dados Setoriais',
    },
    {
      nome: 'Atualização Cadastral no Mosaico',
      tipo: 'CADASTRAL_MOSAICO' as const,
      frequencia: 'ANUAL' as const,
      prazoDia: 31, // 31 de janeiro
      prazoRegra: 'DIA_CORRIDO' as const,
      descricao: 'Atualização obrigatória dos dados cadastrais da prestadora no Sistema Mosaico da ANATEL. Prazo: 31 de janeiro de cada ano.',
      fundamentacaoLegal: 'Regulamento de Outorga ANATEL',
    },
    {
      nome: 'Coleta Semestral de Dados',
      tipo: 'DICI_SEMESTRAL' as const,
      frequencia: 'SEMESTRAL' as const,
      prazoDia: 15,
      prazoRegra: 'DIA_CORRIDO' as const,
      descricao: 'Envio semestral de dados econômicos e de infraestrutura à ANATEL.',
      fundamentacaoLegal: 'Resolução ANATEL — Coleta de Dados Setoriais',
    },
    {
      nome: 'Conformidade com RGC — Atendimento ao Consumidor',
      tipo: 'CONFORMIDADE_RGC' as const,
      frequencia: 'ANUAL' as const,
      prazoDia: 31,
      prazoRegra: 'DIA_CORRIDO' as const,
      descricao: 'Verificação anual de conformidade com o Regulamento Geral de Direitos do Consumidor: central de atendimento (8h-20h, dias úteis), gravação de chamadas (retenção 90 dias), divulgação de valores individuais e combinados.',
      fundamentacaoLegal: 'Resolução nº 632/2014 (RGC)',
    },
    {
      nome: 'Notificação de Incidentes de Segurança Cibernética',
      tipo: 'SEGURANCA_CIBERNETICA' as const,
      frequencia: 'EVENTUAL' as const,
      prazoDia: 1, // 24h para críticos
      prazoRegra: 'DIA_CORRIDO' as const,
      descricao: 'Notificação obrigatória de incidentes de segurança à ANATEL. Prazos: 24h (crítico), 5 dias úteis (grave), 15 dias úteis (moderado).',
      fundamentacaoLegal: 'Resolução nº 740/2020 + Resolução nº 767/2024',
    },
  ]

  for (const obligation of obligations) {
    await prisma.obligation.upsert({
      where: {
        id: obligation.nome, // Usar nome como chave temporária
      },
      update: obligation,
      create: obligation,
    })
  }

  console.log(`✅ ${obligations.length} obrigações regulatórias criadas`)

  // ============================================
  // TEMPLATES DE CONTRATO
  // ============================================
  const templates = [
    {
      nome: 'Contrato de Prestação de Serviço SCM — Pessoa Física',
      tipo: 'CONTRATO_SCM_PF',
      conteudo: `CONTRATO DE PRESTAÇÃO DE SERVIÇO DE COMUNICAÇÃO MULTIMÍDIA

CONTRATADA: {{razaoSocial}}, inscrita no CNPJ sob nº {{cnpj}}, com sede em {{endereco}}, autorizada pela ANATEL para prestação do Serviço de Comunicação Multimídia - SCM conforme Termo de Autorização nº {{numeroOutorga}}.

CONTRATANTE: {{nomeCliente}}, inscrito(a) no CPF sob nº {{cpfCliente}}, residente em {{enderecoCliente}}.

CLÁUSULA 1ª — DO OBJETO
O presente contrato tem por objeto a prestação do Serviço de Comunicação Multimídia (SCM), conforme plano contratado.

CLÁUSULA 2ª — DO PLANO CONTRATADO
Plano: {{nomePlano}}
Velocidade de download: {{velocidadeDown}} Mbps
Velocidade de upload: {{velocidadeUp}} Mbps
Valor mensal: R$ {{valorMensal}}

CLÁUSULA 3ª — DA VIGÊNCIA
Este contrato tem vigência de 12 (doze) meses a partir da data de ativação do serviço.

CLÁUSULA 4ª — DOS DIREITOS DO CONSUMIDOR
Conforme Regulamento Geral de Direitos do Consumidor (Resolução nº 632/2014 da ANATEL):
a) O consumidor tem direito a cancelar o serviço a qualquer momento;
b) A velocidade média contratada será de no mínimo 80% da velocidade nominal;
c) A CONTRATADA disponibiliza central de atendimento das 8h às 20h, dias úteis;
d) Todas as ligações ao SAC serão gravadas e mantidas por 90 dias.

{{cidade}}, {{dataContrato}}

_______________________________
{{razaoSocial}}
CNPJ: {{cnpj}}

_______________________________
{{nomeCliente}}
CPF: {{cpfCliente}}`,
      variaveis: {
        razaoSocial: 'string',
        cnpj: 'string',
        endereco: 'string',
        numeroOutorga: 'string',
        nomeCliente: 'string',
        cpfCliente: 'string',
        enderecoCliente: 'string',
        nomePlano: 'string',
        velocidadeDown: 'number',
        velocidadeUp: 'number',
        valorMensal: 'number',
        cidade: 'string',
        dataContrato: 'string',
      },
    },
    {
      nome: 'Política de Privacidade — LGPD + ANATEL',
      tipo: 'POLITICA_PRIVACIDADE',
      conteudo: `POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS

{{razaoSocial}} ("Nós"), inscrita no CNPJ sob nº {{cnpj}}, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e regulamentações da ANATEL, apresenta sua Política de Privacidade.

1. DADOS COLETADOS
Coletamos os seguintes dados pessoais para prestação do Serviço de Comunicação Multimídia:
- Nome completo, CPF/CNPJ, endereço
- Dados de contato (telefone, e-mail)
- Dados de consumo do serviço (tráfego, velocidade)
- Registros de conexão (conforme Marco Civil da Internet — Lei nº 12.965/2014)

2. FINALIDADE DO TRATAMENTO
Os dados são tratados para: prestação do serviço contratado, faturamento, cumprimento de obrigações regulatórias junto à ANATEL (DICI, SICI), e comunicações sobre o serviço.

3. COMPARTILHAMENTO
Seus dados podem ser compartilhados com: ANATEL (obrigações regulatórias), autoridades judiciais (mediante ordem judicial), e prestadores de serviço essenciais à operação.

4. RETENÇÃO
- Registros de conexão: 1 ano (Marco Civil da Internet)
- Gravações de atendimento: 90 dias (RGC ANATEL)
- Dados cadastrais: durante vigência do contrato + 5 anos

5. DIREITOS DO TITULAR
Você pode solicitar: acesso, correção, portabilidade, exclusão de dados, e revogação de consentimento, através do canal {{emailDpo}}.

6. ENCARREGADO DE DADOS (DPO)
{{nomeDpo}} — {{emailDpo}}

Última atualização: {{dataAtualizacao}}`,
      variaveis: {
        razaoSocial: 'string',
        cnpj: 'string',
        emailDpo: 'string',
        nomeDpo: 'string',
        dataAtualizacao: 'string',
      },
    },
  ]

  for (const template of templates) {
    await prisma.contractTemplate.create({
      data: template,
    })
  }

  console.log(`✅ ${templates.length} templates de contrato criados`)

  // ============================================
  // ARTIGOS BASE DE CONHECIMENTO
  // ============================================
  const articles = [
    {
      titulo: 'Como enviar o DICI mensal à ANATEL',
      slug: 'como-enviar-dici-mensal',
      categoria: 'Relatórios',
      tags: ['DICI', 'mensal', 'CSV', 'ANATEL'],
      publicado: true,
      conteudo: `# Como enviar o DICI mensal à ANATEL

## O que é o DICI?
O DICI (Sistema de Dados, Informação, Conhecimento e Inteligência) substituiu o antigo SICI em 2021. Todo prestador de SCM e STFC deve enviar mensalmente seus dados de acessos.

## Prazo
Até o **15º dia corrido** do mês seguinte ao período de referência. Se cair em fim de semana ou feriado nacional, o prazo é postergado para o próximo dia útil.

## Passo a passo

### 1. Preparar os dados
Reúna as seguintes informações do mês:
- [ ] Quantidade de acessos ativos por município
- [ ] Classificação por tipo (pessoa física / jurídica)
- [ ] Tecnologia utilizada (FTTX, Rádio, Cable Modem, etc.)
- [ ] Velocidades de download e upload
- [ ] Zona (urbana / rural)

### 2. Gerar o arquivo CSV
O arquivo deve seguir rigorosamente o formato ANATEL:
- **Encoding:** UTF-8 BOM
- **Delimitador de linha:** CRLF
- **Campos:** CNPJ, Código IBGE, Tipo Acesso, Tecnologia, Vel. Down, Vel. Up, Quantidade, Zona

### 3. Acessar o sistema
1. Acesse: https://apps.anatel.gov.br/Acesso/Login.aspx?Sistema=ColetadeDadosAnatel
2. Faça login com suas credenciais GOV.BR
3. Selecione o período de referência
4. Faça upload do arquivo CSV
5. Confirme o envio

### 4. Verificar confirmação
Após o envio, verifique se o sistema confirmou o recebimento sem erros.

## Dicas
- Use o RegTelecom para gerar o CSV automaticamente no formato correto
- Sempre valide os dados antes de enviar
- Compare com o mês anterior para identificar variações incomuns

## Legislação
- Resolução ANATEL — Sistema de Coleta de Dados Setoriais
- Manual: https://www.gov.br/anatel/pt-br/dados/coleta-de-dados-setoriais`,
      legislacaoRefs: [
        { titulo: 'Manual Coleta de Dados', url: 'https://www.gov.br/anatel/pt-br/dados/coleta-de-dados-setoriais' },
        { titulo: 'Sistema Coleta ANATEL', url: 'https://apps.anatel.gov.br/Acesso/Login.aspx?Sistema=ColetadeDadosAnatel' },
      ],
    },
    {
      titulo: 'Como calcular e pagar o FUST',
      slug: 'como-calcular-pagar-fust',
      categoria: 'Contribuições',
      tags: ['FUST', 'contribuição', 'receita', 'pagamento'],
      publicado: true,
      conteudo: `# Como calcular e pagar o FUST

## O que é o FUST?
O Fundo de Universalização dos Serviços de Telecomunicações (FUST) é uma contribuição obrigatória para todos os prestadores de serviços de telecomunicações.

## Alíquota
**1%** sobre a receita operacional bruta.

## Base de cálculo
Receita Operacional Bruta **menos**:
- ICMS
- PIS/COFINS

## Prazo
Até o **dia 10** de cada mês, referente ao mês anterior.

## Passo a passo
1. [ ] Apure a receita operacional bruta do mês
2. [ ] Deduza ICMS e PIS/COFINS
3. [ ] Aplique a alíquota de 1%
4. [ ] Acesse o Sistema de Acolhimento da Declaração do FUST
5. [ ] Preencha a declaração mensal
6. [ ] Gere e pague o boleto

## Legislação
- Lei nº 9.998/2000`,
      legislacaoRefs: [
        { titulo: 'Lei nº 9.998/2000 — FUST', url: 'https://www.planalto.gov.br/ccivil_03/leis/l9998.htm' },
      ],
    },
  ]

  for (const article of articles) {
    await prisma.knowledgeArticle.create({
      data: article,
    })
  }

  console.log(`✅ ${articles.length} artigos da base de conhecimento criados`)

  console.log('🎉 Seed completo!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
