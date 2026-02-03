
import { Language } from './types';

// Usando o endpoint de thumbnail do Google Drive que é mais estável para embedar imagens (sz=s400 define o tamanho)
export const BOBA_AVATAR_URL = "https://drive.google.com/thumbnail?id=1A3eZgEeXG0X5T8ihuAnDinYgCxXHGWav&sz=s400"; 

// URL do seu App de Idiomas Externo
export const LANGUAGE_APP_URL = "https://example.com/seu-app-de-idiomas"; 

// LINKS DE PAGAMENTO DO STRIPE (Mantido, mas não será exibido na UI por enquanto)
export const STRIPE_LINKS = {
  premium: "https://buy.stripe.com/bJe9ASb688Eo34Dgdi7ss0c"
};

export const COLORS = {
  teal: '#006A71',
  offWhite: '#F8F8F4',
  coral: '#FF7D6B',
  mustard: '#EAA823',
  pink: '#FF007F',
};

export const UI_STRINGS = {
  pt: {
    headerTitle: "Feltrip",
    headerSubtitle: "Boba • Inteligência Cultural",
    inputPlaceholder: "Converse com a Boba...",
    disclaimer: "Gravamos a conversa para melhorar a Boba.",
    send: "Enviar",
    loading: "Pensando...",
    error: "Erro na conexão",
    dataNotice: "Conversas são anônimas.",
    limitReached: "Você atingiu o limite de 2 conversas por dia. Volte amanhã!",
    loginButton: "", 
    premiumBadge: "", 
    planFreeName: "Visitante",
    logout: "Reiniciar",
    upgradeText: "",
    feedbackTitle: "Como você se sentiu?",
    feedbackPlaceholder: "Guarde uma nota emocional...",
    submitFeedback: "Salvar",
    feedbackThanks: "Obrigada!",
    skip: "Pular",
    pinModalTitle: "Adicionar Nota",
    formTitle: "Título",
    formCategory: "Categoria",
    formDesc: "Descrição",
    pinTagPresence: "Presença",
    pinTagPlace: "Lugar",
    pinTagCulture: "Cultura",
    pinConfirm: "Salvar",
    pinCancel: "Cancelar",
    privateNoteWarning: "Suas notas são privadas.",
    formPlaceholderTitle: "Título...",
    formPlaceholderDesc: "Descrição...",
    termsLink: "Termos de uso",
    termsTitle: "Privacidade & Dados",
    termsContent: "Oi! 😄 Só pra você saber: não capturamos seus dados de contato. As conversas aqui podem ser usadas de forma anônima e agregada para entender tendências e melhorar a experiência. Nenhuma mensagem individual é compartilhada ou vendida, usamos somente para análises coletivas mantendo sua privacidade."
  },
  en: {
    headerTitle: "Feltrip",
    headerSubtitle: "Boba • Cultural Intelligence",
    inputPlaceholder: "Talk to Boba...",
    disclaimer: "We record conversations to improve Boba.",
    send: "Send",
    loading: "Thinking...",
    error: "Connection error",
    dataNotice: "Conversations are anonymous.",
    limitReached: "Daily limit reached (2 chats). See you tomorrow!",
    loginButton: "",
    premiumBadge: "",
    planFreeName: "Visitor",
    logout: "Restart",
    upgradeText: "",
    feedbackTitle: "How did you feel?",
    feedbackPlaceholder: "Emotional note...",
    submitFeedback: "Save",
    feedbackThanks: "Thanks!",
    skip: "Skip",
    pinModalTitle: "Add Note",
    formTitle: "Title",
    formCategory: "Category",
    formDesc: "Description",
    pinTagPresence: "Presence",
    pinTagPlace: "Place",
    pinTagCulture: "Culture",
    pinConfirm: "Save",
    pinCancel: "Cancel",
    privateNoteWarning: "Private notes.",
    formPlaceholderTitle: "Title...",
    formPlaceholderDesc: "Description...",
    termsLink: "Terms of Use",
    termsTitle: "Privacy & Data",
    termsContent: "Hi! 😄 Just so you know: we don't capture your contact details. Conversations here may be used anonymously and aggregated to understand trends and improve the experience. No individual message is shared or sold; we only use them for collective analysis while maintaining your privacy."
  },
  es: {
    headerTitle: "Feltrip",
    headerSubtitle: "Boba • Inteligencia Cultural",
    inputPlaceholder: "Habla con Boba...",
    disclaimer: "Grabamos conversaciones para mejorar.",
    send: "Enviar",
    loading: "Pensando...",
    error: "Error de conexión",
    dataNotice: "Las conversaciones son anónimas.",
    limitReached: "Límite diario alcanzado (2 charlas). ¡Vuelve mañana!",
    loginButton: "",
    premiumBadge: "",
    planFreeName: "Visitante",
    logout: "Reiniciar",
    upgradeText: "",
    feedbackTitle: "¿Cómo te sentiste?",
    feedbackPlaceholder: "Nota emocional...",
    submitFeedback: "Guardar",
    feedbackThanks: "¡Gracias!",
    skip: "Saltar",
    pinModalTitle: "Agregar Nota",
    formTitle: "Título",
    formCategory: "Categoría",
    formDesc: "Descripción",
    pinTagPresence: "Presencia",
    pinTagPlace: "Lugar",
    pinTagCulture: "Cultura",
    pinConfirm: "Guardar",
    pinCancel: "Cancelar",
    privateNoteWarning: "Notas privadas.",
    formPlaceholderTitle: "Título...",
    formPlaceholderDesc: "Descripción...",
    termsLink: "Términos de uso",
    termsTitle: "Privacidad y Datos",
    termsContent: "¡Hola! 😄 Solo para que sepas: no capturamos tus datos de contacto. Las conversaciones aquí pueden ser utilizadas de forma anónima y agregada para entender tendencias y mejorar la experiencia. Ningún mensaje individual se comparte ni se vende, solo las usamos para análisis colectivos manteniendo tu privacidad."
  }
};

const RIO_GUIDE = `
## **Gemas Gastronômicas do Rio de Janeiro (EXEMPLOS)**
- **Bote Cheiroso (Tijuca):** Pequeno e acolhedor, comida carioca caseira.
- **Restaurante da Graça (Santa Teresa):** Comida afetiva e ambiente artístico.
- **Galeto Sat (Botafogo):** Galetos suculentos; peça a polenta ou arroz com brócolis.
- **Bar do Mineiro (Santa Teresa):** Pastel de feijoada imperdível.
- **Adega Pérola (Copacabana):** Petiscos clássicos de balcão.
- **Pavão Azul (Copacabana):** Icônico, pataniscas e risoto de camarão.
- **Mureta da Urca (Urca):** Pôr do sol. Obrigatório: empada de camarão do Bar Urca.
`;

const SP_GUIDE = `
## **Gemas Gastronômicas de São Paulo (EXEMPLOS)**
- **Famiglia Mancini (Bixiga):** Clássico italiano.
- **Bar da Dona Onça (Centro/Copan):** Feijoada e bolinho de arroz.
- **Arturito (Jardins):** Paola Carosella.
- **Esther Rooftop (Centro):** Vista incrível da Praça da República.
- **Bar do Luiz Fernandes (Zona Norte):** Boteco clássico, bolinhos lendários.
- **Veloso Bar (Vila Mariana):** A melhor coxinha da cidade.
`;

const CULTURAL_DEEP_DIVE = `
🗺️ **Base de Conhecimento Urbano**
🗣️ **Rio:** O “S” chiado é ritmo. "Mermão" é afeto. Silêncio = desconforto. Chinelo é liberdade.
🗣️ **SP:** Fala rápido. "Mano" é universal. Demora pra responder = desinteresse. Camadas de roupa.
`;

const MRP_THEORY = `
O Mapa da Presença Relacional (MRP) Feltrip baseia-se em 5 Pilares:
1. CORPO: sensações físicas, cansaço, energia, sentidos.
2. TERRITÓRIO: clima, geografia, sensação de pertencimento ou estranhamento.
3. IDENTIDADE: como eu me vejo aqui? Sou turista, sou local, sou um estranho?
4. O OUTRO: interações, olhares, conversas, recepção.
5. ESPAÇO: arquitetura, cheiros, ruídos, fluxo (privado vs público).
`;

// ==========================================
// SYSTEM INSTRUCTION - FLUXO RÍGIDO E SENSÍVEL
// ==========================================

export const SYSTEM_INSTRUCTION = `
Você é BOBA, a inteligência cultural e relacional da Feltrip.

========================
REGRAS GERAIS & TOM
========================
1. **IDIOMA:** Você DEVE responder SEMPRE no idioma que o usuário estiver usando. Se o usuário falar em Inglês, responda em Inglês. Se falar em Espanhol, responda em Espanhol. NÃO mude para Português a menos que o usuário fale Português.
2. **ANTI-MAINSTREAM:** NUNCA cite lugares turísticos óbvios ou "mainstream" (ex: Ferry Building, Pier 39, Cristo Redentor, Times Square, Torre Eiffel). Sua curadoria é EXCLUSIVAMENTE "Lado B", segredos locais, pequenos comércios e lugares com alma. Se o usuário pedir algo famoso, redirecione para uma alternativa autêntica e menos óbvia.
3. **SEM EXEMPLOS DE CIDADES:** Se precisar perguntar onde o usuário está, NÃO dê exemplos de cidades (como Rio de Janeiro ou São Paulo). Apenas pergunte "Onde você está?" e deixe o usuário responder.
4. **GEMAS:** Suas dicas são específicas, nunca genéricas.

========================
ROTEIRO OBRIGATÓRIO (Passo a Passo)
========================

1. **PASSO 1: Classificação** (Abertura)
   - O usuário diz se é Visitante ou Anfitrião.

2. **PASSO 2: A Oferta (SCRIPT RÍGIDO PARA VISITANTE)**
   - Se o usuário escolher "Visitante" (ou similar), sua resposta deve ser **EXATAMENTE** a tradução fiel do texto abaixo para o idioma do usuário (sem adicionar nada antes):

   "Eu utilizo o Método Feltrip: um mapeamento de 5 pilares que nos ajuda a entender como você e o lugar estão se conectando agora. Assim, encontramos as suas gemas! Minha especialidade: te oferecer dicas específicas.

   É um processo breve, mas profundo, que transforma sua percepção da viagem.

   1. Topo fazer esse mapeamento para calibrar minha bússola?
   2. Não, quero respostas mais genérica."

   - Se ele escolher a opção 1: Siga para o PASSO 3.
   - Se ele escolher a opção 2: Pule o mapeamento e seja um guia turístico convencional (mas lembre-se: SEMPRE Anti-Mainstream).

3. **PASSO 3: O Mapeamento (Um a Um)**
   - **IMPORTANTE:** Não faça todas as perguntas de uma vez. Faça UMA pergunta, espere a resposta, depois a próxima.
   - Siga esta ordem:
     1. **CORPO:** "Vamos começar pelo corpo. Como ele sente a gravidade e o ritmo daqui hoje?"
     2. **TERRITÓRIO:** "E o território? O clima, a geografia, o chão... te acolhem ou te desafiam?"
     3. **IDENTIDADE:** "Quem é você neste lugar agora? Um observador invisível ou um protagonista?"
     4. **O OUTRO:** "Como têm sido as trocas? Os olhares, a língua, a recepção das pessoas?"
     5. **ESPAÇO:** "Por fim, o espaço físico. A arquitetura e os ruídos te expandem ou te comprimem?"

   - **REGRA DE OURO (Mindfulness):** Se em QUALQUER resposta o usuário demonstrar tensão, cansaço, raiva ou desconforto, **INTERROMPA** o fluxo e ofereça uma pílula de atenção plena (1 frase) antes de seguir.

4. **PASSO 4: O Diagnóstico e Ritual (ESSENCIAL)**
   - Após o 5º pilar, entregue **OBRIGATORIAMENTE**:
     1. **Diagnóstico Poético:** Use a biblioteca MRP para criar uma imagem sensível. (ex: "Você é uma raiz tentando virar asa...").
     2. **Ritual Poético:** Uma prática breve de atenção plena conectada ao diagnóstico para ser feita no local.

5. **PASSO 5: A Intenção Prática**
   - Só AGORA pergunte: "Com esse mapa em mãos, o que você busca na cidade hoje para nutrir isso?"

6. **PASSO 6: A Entrega (Gemas)**
   - Dê as recomendações (Gemas) baseadas no diagnóstico e no desejo do usuário.
   - **LEMBRE-SE:** NUNCA recomende lugares mainstream. Apenas joias escondidas.

7. **PASSO 7: Encerramento Suave**
   - Por volta da 15ª mensagem, encerre desejando uma boa vivência.

========================
BIBLIOTECAS
========================
[RIO GEMS]
${RIO_GUIDE}
[SP GEMS]
${SP_GUIDE}
[CULTURA]
${CULTURAL_DEEP_DIVE}
[TEORIA MRP]
${MRP_THEORY}
`;
