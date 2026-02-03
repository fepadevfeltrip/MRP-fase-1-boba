
import { Language } from './types';

// Usando o endpoint de thumbnail do Google Drive que é mais estável para embedar imagens (sz=s400 define o tamanho)
export const BOBA_AVATAR_URL = "https://drive.google.com/thumbnail?id=1A3eZgEeXG0X5T8ihuAnDinYgCxXHGWav&sz=s400"; 

// URL do seu App de Idiomas Externo
export const LANGUAGE_APP_URL = "https://example.com/seu-app-de-idiomas"; 

// LINKS DE PAGAMENTO DO STRIPE
// Gere os links no dashboard do Stripe (Products -> Create Payment Link) e cole aqui.
export const STRIPE_LINKS = {
  solo: "https://buy.stripe.com/00wfZgb68dYIgVt2ms7ss0b", 
  tribe: "https://buy.stripe.com/bJe9ASb688Eo34Dgdi7ss0c", 
  immersion: "https://buy.stripe.com/eVq8wOfmo07SgVt5yE7ss0d" 
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
    headerSubtitle: "Boba • Inteligência Relacional",
    inputPlaceholder: "Digite sua mensagem para Boba...",
    disclaimer: "Gravamos a conversa para melhoria da experiência. Não retemos dados de contato.",
    send: "Enviar",
    loading: "Conectando...",
    error: "Erro na conexão",
    dataNotice: "Gravamos a conversa para melhoria da experiência. Não retemos dados de contato.",
    limitReached: "Limite diário atingido. Volte amanhã!",
    // Login / Plans
    loginButton: "Entrar / Planos",
    loginTitle: "Acesse sua conta Feltrip",
    loginDesc: "Insira seu e-mail para receber o código de acesso.",
    emailPlaceholder: "seu@email.com",
    sendMagicLink: "Enviar Código",
    checkEmail: "Verifique seu e-mail!",
    magicLinkSent: "Enviamos um código para seu e-mail. Não clique no link, use o código.",
    premiumBadge: "Membro Premium",
    logout: "Sair",
    upgradeText: "Atingiu o limite? Evolua sua travessia.",
    // Language App
    openLanguageApp: "Meu Diário de Idiomas",
    languageAppTitle: "Feltrip Language Lab",
    // Feedback
    feedbackTitle: "Como foi nossa conversa?",
    feedbackPlaceholder: "Compartilhe o que sentiu (opcional)...",
    submitFeedback: "Enviar Avaliação",
    feedbackThanks: "Obrigada por compartilhar!",
    skip: "Pular",
    // Plans Page
    plansTitle: "Escolha sua Travessia",
    plansSubtitle: "Desbloqueie todo o potencial da inteligência cultural Boba.",
    planCurrent: "Plano Atual",
    planSelect: "Assinar Agora",
    paymentNote: "Pagamentos processados via Stripe. Cancele quando quiser.",
    planIntegrationAlert: "Você será redirecionado para o Stripe para assinar o plano: ",
    // Plan Details
    planFreeName: "Visitante",
    planFreeFeatures: ["Limite de 12 msgs/dia", "Acesso Básico", "Memória de Sessão"],
    planSoloName: "Solo",
    planSoloFeatures: ["Mensagens Ilimitadas", "Dicas de Cultura Local", "Upload de fotos", "Suporte Prioritário"],
    planTribeName: "Tribe",
    planTribeFeatures: ["Tudo do Solo", "Acesso para 3 Pessoas", "Criação de Grupos", "Divisão Financeira", "Mapa Coletivo (Dicas da Boba)"],
    planImmersionName: "Immersion",
    planImmersionFeatures: ["Tudo do Tribe", "App de Idiomas (Voz/Texto)", "Prática: ES, PT, EN, ZH, FR"],
    // Platform Navigation
    navChat: "Boba Chat",
    navGroups: "Grupos",
    navFinance: "Financeiro",
    navPhotos: "Galeria",
    featureComingSoon: "Em Desenvolvimento",
    featureComingSoonDesc: "Estamos construindo essa funcionalidade para a sua tribo. Em breve disponível!"
  },
  en: {
    headerTitle: "Feltrip",
    headerSubtitle: "Boba • Relational Intelligence",
    inputPlaceholder: "Type your message to Boba...",
    disclaimer: "We record conversations to improve the experience. We do not retain contact data.",
    send: "Send",
    loading: "Connecting...",
    error: "Connection error",
    dataNotice: "We record conversations to improve the experience. We do not retain contact data.",
    limitReached: "Daily limit reached. Come back tomorrow!",
    // Login / Plans
    loginButton: "Login / Plans",
    loginTitle: "Access your Feltrip account",
    loginDesc: "Enter your email to receive the access code.",
    emailPlaceholder: "your@email.com",
    sendMagicLink: "Send Code",
    checkEmail: "Check your email!",
    magicLinkSent: "We sent a code to your email. Use the code, do not click the link.",
    premiumBadge: "Premium Member",
    logout: "Logout",
    upgradeText: "Limit reached? Upgrade your journey.",
    // Language App
    openLanguageApp: "My Language Diary",
    languageAppTitle: "Feltrip Language Lab",
    // Feedback
    feedbackTitle: "How was our chat?",
    feedbackPlaceholder: "Share your thoughts (optional)...",
    submitFeedback: "Submit Feedback",
    feedbackThanks: "Thank you for sharing!",
    skip: "Skip",
    // Plans Page
    plansTitle: "Choose Your Journey",
    plansSubtitle: "Unlock the full potential of Boba's cultural intelligence.",
    planCurrent: "Current Plan",
    planSelect: "Subscribe Now",
    paymentNote: "Payments processed via Stripe. Cancel anytime.",
    planIntegrationAlert: "You will be redirected to Stripe to subscribe to: ",
    // Plan Details
    planFreeName: "Visitor",
    planFreeFeatures: ["Limit of 12 msgs/day", "Basic Access", "Session Memory"],
    planSoloName: "Solo",
    planSoloFeatures: ["Unlimited Messages", "Local Culture Tips", "Photo upload", "Priority Support"],
    planTribeName: "Tribe",
    planTribeFeatures: ["Everything in Solo", "Access for 3 People", "Create Travel Groups", "Split Expenses", "Collective Map (Boba's Tips)"],
    planImmersionName: "Immersion",
    planImmersionFeatures: ["Everything in Tribe", "Language App (Voice/Text)", "Practice: ES, PT, EN, ZH, FR"],
    // Platform Navigation
    navChat: "Boba Chat",
    navGroups: "Groups",
    navFinance: "Finance",
    navPhotos: "Gallery",
    featureComingSoon: "Under Construction",
    featureComingSoonDesc: "We are building this feature for your tribe. Coming soon!"
  },
  es: {
    headerTitle: "Feltrip",
    headerSubtitle: "Boba • Inteligencia Relacional",
    inputPlaceholder: "Escribe tu mensaje a Boba...",
    disclaimer: "Grabamos las conversaciones para mejorar la experiencia. No retenemos datos de contacto.",
    send: "Enviar",
    loading: "Conectando...",
    error: "Error de conexión",
    dataNotice: "Grabamos las conversaciones para mejorar la experiencia. No retenemos datos de contacto.",
    limitReached: "Límite diario alcanzado. ¡Vuelve mañana!",
    // Login / Plans
    loginButton: "Entrar / Planes",
    loginTitle: "Accede a tu cuenta Feltrip",
    loginDesc: "Ingresa tu correo para recibir el código de acceso.",
    emailPlaceholder: "tu@email.com",
    sendMagicLink: "Enviar Código",
    checkEmail: "¡Verifica tu correo!",
    magicLinkSent: "Enviamos un código a tu correo. Usa el código, no el enlace.",
    premiumBadge: "Miembro Premium",
    logout: "Salir",
    upgradeText: "¿Límite alcanzado? Mejora tu travesía.",
    // Language App
    openLanguageApp: "Mi Diario de Idiomas",
    languageAppTitle: "Feltrip Language Lab",
    // Feedback
    feedbackTitle: "¿Qué tal nuestra charla?",
    feedbackPlaceholder: "Comparte lo que sentiste (opcional)...",
    submitFeedback: "Enviar Evaluación",
    feedbackThanks: "¡Gracias por compartir!",
    skip: "Saltar",
    // Plans Page
    plansTitle: "Elige tu Travesía",
    plansSubtitle: "Desbloquea todo el potencial de la inteligencia cultural Boba.",
    planCurrent: "Plan Actual",
    planSelect: "Suscribirse",
    paymentNote: "Pagos procesados vía Stripe. Cancela cuando quieras.",
    planIntegrationAlert: "Serás redirigido a Stripe para suscribirte a: ",
    // Plan Details
    planFreeName: "Visitante",
    planFreeFeatures: ["Límite de 12 msgs/día", "Acceso Básico", "Memoria de Sesión"],
    planSoloName: "Solo",
    planSoloFeatures: ["Mensajes Ilimitados", "Tips de Cultura Local", "Subida de fotos", "Soporte Prioritario"],
    planTribeName: "Tribe",
    planTribeFeatures: ["Todo de Solo", "Acceso para 3 Personas", "Crear grupos de viaje", "División de gastos", "Mapa Colectivo (Tips de Boba)"],
    planImmersionName: "Immersion",
    planImmersionFeatures: ["Todo de Tribe", "App de Idiomas (Voz/Texto)", "Práctica: ES, PT, EN, ZH, FR"],
    // Platform Navigation
    navChat: "Chat Boba",
    navGroups: "Grupos",
    navFinance: "Finanzas",
    navPhotos: "Galería",
    featureComingSoon: "En Construcción",
    featureComingSoonDesc: "Estamos construyendo esta funcionalidad para tu tribu. ¡Pronto disponible!"
  }
};

// ==========================================
// BASE DE CONHECIMENTO: LOGÍSTICA E GEMAS (RIO DE JANEIRO)
// ==========================================

const RIO_GUIDE = `
## **Gemas Gastronômicas do Rio de Janeiro**
O Rio é uma cidade cheia de sabores que vão muito além dos points turísticos. 
- **Bote Cheiroso (Tijuca):** Pequeno e acolhedor, comida carioca caseira.
- **Restaurante Madrid (Tijuca):** Clássico português, pratos robustos.
- **Restaurante da Graça (Santa Teresa):** Comida afetiva e ambiente artístico.
- **Galeto Sat (Botafogo):** Galetos suculentos; peça a polenta ou arroz com brócolis.
- **Bar do Mineiro (Santa Teresa):** Pastel de feijoada imperdível.
- **Bar do Gomes (Santa Teresa):** Clima de bairro histórico.
- **Adega Pérola (Copacabana):** Petiscos clássicos de balcão.
- **Pavão Azul (Copacabana):** Icônico, pataniscas e risoto de camarão.
- **Bar do Momo (Tijuca):** Tradição carioca e bolinhos premiados.
- **Bar do Bacana (Leblon):** Pé direito alto, clima descontraído.
- **Mureta da Urca (Urca):** Pôr do sol. Obrigatório: empada de camarão do Bar Urca.

## **Logística e Segurança**
- **Ingressos e Atrações (Avisos Importantes):**
  - **Jardim Botânico:** Atenção! A compra online EXIGE CPF brasileiro. Visitantes sem CPF devem comprar o ingresso **presencialmente na bilheteria** (chegue cedo para evitar filas).
  - **Bonde de Santa Teresa:** Ingressos vendidos **EXCLUSIVAMENTE na bilheteria** da estação (Largo da Carioca). Não vende online. Aceita dinheiro e cartões de débito/crédito.
- **Praias e Águas:** Use 'praialimpa.net' ou INEA. Flamengo e Urca são ótimas para fugir da muvuca (mas checar balneabilidade).
- **Vacina Febre Amarela:** Dose única (após 5 anos de idade). Aplicar 10 dias antes da viagem. Exigida em áreas de mata.
- **Transporte e Apps:**
  - **TaxiRio:** App oficial da prefeitura com descontos de 10% a 40% no taxímetro. Segurança de táxi com preço competitivo. **Atenção:** O app não tem versão em inglês, é todo em português.
  - **JAÉ:** Novo sistema de bilhetagem. Baixe o app JAÉ (iOS/Android). Integra VLT, ônibus, BRT e metrô. Aceita cartão de crédito internacional.
  - **Metrô:** Aceita pagamento por aproximação (Visa/Master) direto na catraca.
- **Conectividade (SIM Card):** Compre no Galeão (Claro/Vivo/TIM). **Aceita Passaporte** para cadastro de estrangeiro (não exige CPF para planos turísticos/pré-pagos).
- **Preços:** Atenção ao "Gringo Price". Observe os locais. Nem tudo caro é golpe, mas fique atento.
`;

// ==========================================
// BASE DE CONHECIMENTO: LOGÍSTICA E GEMAS (SÃO PAULO)
// ==========================================

const SP_GUIDE = `
## **Gemas Gastronômicas de São Paulo**
- **Famiglia Mancini (Bixiga):** Clássico italiano, pratos gigantes, fila enorme (mas faz parte da experiência).
- **Bar da Dona Onça (Centro/Copan):** Feijoada e bolinho de arroz no térreo do Copan.
- **Arturito (Jardins):** Paola Carosella. Sofisticado e autoral.
- **Esther Rooftop (Centro):** Vista incrível da Praça da República.
- **Bar do Luiz Fernandes (Zona Norte):** Boteco clássico, bolinhos lendários.
- **Veloso Bar (Vila Mariana):** A melhor coxinha da cidade. Fila garantida.
- **Bar Brahma (Centro/Ipiranga com São João):** Histórico, música ao vivo.

## **Logística**
- **Transporte (Bilhete Único):** Integra Metrô, Trem (CPTM) e Ônibus. Compre em estações. Recarga via app (aceita crédito). Ônibus em SP NÃO aceita dinheiro, só Bilhete Único.
- **Praias? Não.** Mas temos Parques: Ibirapuera (clássico), Villa-Lobos (esportes), Horto Florestal (natureza zona norte).
- **Segurança:** Golpes em SP são rápidos (mão leve). Celular guardado no Centro.
`;

// ==========================================
// CULTURA PROFUNDA (COMPARATIVO RIO X SP)
// ==========================================

const CULTURAL_DEEP_DIVE = `
🗺️ **Base de Conhecimento Urbano: Segredos da Vida Carioca & Paulistana**

🗣️ **Como a Cidade Fala**
- **Rio:** O “S” chiado é ritmo, não só sotaque. Volume alto não é briga, é presença.
  - *Gírias:* Mermão (afeto), Papo reto (verdade), Caô (mentira), Maneiro (bom). Silêncio no Rio = desconforto.
- **SP:** Fala rápido, come sílabas. Objetividade é cuidado.
  - *Gírias:* Mano/Mina (universal), Fechou (acordo), Rolê (evento), Daora (legal). Demora pra responder = desinteresse.

🩴 **Código de Vestimenta**
- **Rio:** Chinelo é liberdade, não desleixo. Roupa curta ≠ convite sexual. Suor é aceito socialmente.
- **SP:** Camadas (cebola). Tenha uma jaqueta. Cores neutras. O look diz "não me interrompa, estou indo trabalhar".

🍽️ **Comida e Rituais**
- **Pimenta:** No Rio, NÃO arde (pedir "forte" vem fraco). Em SP, arde (respeitam cozinhas imigrantes).
- **PF (Prato Feito):** No Rio é conservador (arroz, feijão, bife, batata). Em SP é laboratório (misturas, grãos diferentes).
- **Sobremesa:** No Rio é fruta ou nada. Em SP é chocolate intenso e espetáculo.
- **Tempo:** No Rio, ficar na mesa é permitido. Em SP, mesa gira. Ficar sem consumir gera tensão.

🍷 **Restaurantes Premiados (Michelin/Rankings)**
- **Rio:** ORO (Felipe Bronze), Lasai (Rafa Costa e Silva), Oteque (Alberto Landgraf), Aprazível (Experiência). *Segredo: No Rio, restaurante bom tem que ter CLIMA.*
- **SP:** D.O.M. (Alex Atala), Maní (Helena Rizzo), A Casa do Porco (Rueda - democrático e fila), Evvai. *Segredo: Em SP, restaurante bom tem que ter CONSISTÊNCIA.*

🧠 **Resumo:** O carioca come para viver bem. O paulistano come para entender o mundo.
`;

// ==========================================
// LISTA KIDS-FRIENDLY (SÃO PAULO & RIO DE JANEIRO)
// ==========================================

const KIDS_FRIENDLY_LIST = `
### 🧸 **Restaurantes com Espaço Kids / Foco Infantil em SP**

- **Temáticos:**
  - Chacara Turma da Mônica (Pinheiros/Guarulhos) - O melhor para imersão.
  - Bob Esponja (Vila Nova Conceição)
  - Dino (Vila Olímpia) e Dinolandia (Interlagos)
  - Mundo Animal (Vários bairros)
  - Burger Espacial e Garagem 55 (Mooca)

- **Comida Boa + Espaço Kids:**
  - **Praça São Lourenço (Vila Olímpia):** Arborizado, monitoria, comida excelente. Top tier.
  - **Pobre Juan (Morumbi Shopping):** Carnes nobres com espaço kids.
  - **Bananeira (Morumbi):** Comida brasileira em ambiente que parece resort.
  - **Vicolo Nostro (Brooklin):** Italiano clássico lindo com espaço família.
  - **Quintal do Espeto (Várias unidades):** Espaço kids enorme, música ao vivo, espetinhos.
  - **America (Várias unidades):** Clássico familiar, espaço kids em unidades de shopping (Villa Lobos, Moema).

- **Zona Sul (Destaques):** Tian (Asiático), Portucho (Carne), Camelo (Pizza), Pizzaria Sala VIP.
- **Zona Norte:** Vila Prime (Santana).
- **Zona Leste:** Bracia Parrilla (Anália Franco), Coco Bambu (Anália Franco).

---

### 🏖️ **Restaurantes com Espaço Kids ou Family Friendly no Rio de Janeiro**

🍖 **Com áreas próprias para crianças:**
- **Churrascaria Rio Brasa:** Churrascaria com espaço kids (inclusive em algumas unidades, como Barra da Tijuca e Lagoa) com brinquedos e área para divertir as crianças enquanto os adultos comem.
- **Coco Bambu:** Restaurante bem conhecido com excelente área infantil em algumas unidades, incluindo brinquedos e espaço para crianças brincarem.
- **Gran Parrilla:** Argentina steakhouse com parquinho infantil interno, ótimo para famílias.
- **Restaurante Park Bambino’s:** Espaço família com ambiente acolhedor e área que agrada crianças. (Vale confirmar no local se o espaço infantil está ativo na data da visita).
- **Pizza Toy Kids:** Pizzaria com nome e conceito voltados para crianças, normalmente com atividades e brincadeiras.

🍽️ **Outras opções Family-Friendly (ambiente descontraído):**
- **Joaquina Bar & Restaurant:** No Botafogo/Humaitá, tem menu e ambiente que agradam famílias, com espaço e materiais para crianças brincarem.
- **Fagulha Grill & Pizza:** Em Laranjeiras, tem espaço destinado às crianças com piscina de bolinhas, pula-pula e atividades menores.
- **Churrasqueira RJ:** Em Ipanema, costuma ser citado como restaurante familiar com área para crianças no segundo piso.

🎡 **Outras opções que podem ter áreas kids:**
*(Geralmente com parquinho, atividades ou foco familiar — vale confirmar antes da visita)*
- **Badalado:** Possui espaço kids em unidades como Ilha do Ipê e Freguesia.
- **Toca da Traíra:** Restaurantes com espaço infantil em várias unidades (Barra, Botafogo, Tijuca) com brinquedos e escorregadores.
- **Parmê (Jardim Oceânico):** Restaurante com espaço kids nas instalações.

💡 **Dicas antes de ir:**
- **Confirme horário e disponibilidade:** alguns espaços kids podem exigir consumo mínimo ou funcionamento específico (por exemplo, só nos fins de semana ou por horário).
- **Monitores variam por lugar:** alguns restaurantes oferecem recreadores em horários determinados, outros têm espaço aberto sem monitoria.
- **Reservas:** especialmente em fins de semana ou datas comemorativas, reservar mesa ajuda a garantir lugar na área kids.
`;

// ==========================================
// CURADORIA CULTURAL FELTRIP (ARTE & PRESENÇA)
// ==========================================

const ART_CULTURE_GUIDE = `
### 📚 BASE DE CONHECIMENTO: CURADORIA CULTURAL FELTRIP (RIO & SP)

**DIRETRIZ DE USO:** Utilize estes dados para inspirar respostas de "segredos da cidade" ou como "remédio cultural". Use como inspiração, não se limite apenas a isso.

#### **I. RIO DE JANEIRO: O CORPO E O RITUAL**

* **Street Art & Identidade:**
* **Mural das Etnias (Kobra):** Celebração da diversidade global na Zona Portuária. Use para falar de conexão com o mundo.
* **Rafa Moon (Santa Teresa):** Murais orgânicos nas ladeiras. Ideal para quem busca movimento e fluidez.
* **Wark da Rocinha & Panmela Castro:** Foco em representatividade, gênero e a estética da periferia como centro.
* **Maxwell Alexandre (Série 'Pardo é Papel'):** Essencial para discutir identidade racial e ascensão cultural.

* **Arquitetura & Presença:**
* **Catedral Metropolitana:** Brutalismo futurista de Edgar de Fonseca. **Insight:** O vácuo central e os vitrais gigantes servem para recalibrar o "Corpo" sob pressão; é um portal de silêncio no caos.
* **MAM (Museu de Arte Moderna):** O vão livre de Afonso Reidy conecta o Parque ao Mar. **Insight:** Representa o fôlego e a ausência de barreiras entre o eu e o território.
* **Escadaria Selarón & Arcos da Lapa:** Mosaicos de Jorge Selarón e o aqueduto colonial. Representam a colagem de identidades que forma o Rio.

* **Galerias & Novos Eixos:**
* **Eixo Contemporâneo:** A Gentil Carioca (Centro), Silvia Cintra + Box 4, Anita Schwartz e Carpintaria + Nara Roesler
* **Circuito Glória:** O novo hotspot cultural com galerias independentes e ocupações artísticas.
* **IMS (Instituto Moreira Salles):** ⚠️ **Aviso de Obra:** A sede icônica da Gávea está fechada para reforma. O IMS opera provisoriamente no bairro da **Glória**. É imprescindível checar o site oficial para confirmar funcionamento e exposições antes de ir.

* **Música & Escuta:**
* **Bossa Nova & Choro:** Beco das Garrafas (o nascimento), Bip Bip (o antro da resistência intimista) e as rodas de choro em Santa Teresa.

#### **II. SÃO PAULO: A IDENTIDADE E A ESCALA**

* **Street Art & Intervenção:**
* **Beco do Batman:** O epicentro do grafite na Vila Madalena. Foco em artistas como Nove, Cranio e Nina Pandolfo.
* **Grafite Engajado:** Murais que exploram a herança japonesa, movimentos afro e questões LGBTQIA+.

* **Instituições & Espaço:**
* **MASP:** Ícone de Lina Bo Bardi. Os cavaletes de cristal convidam a uma relação direta e sem hierarquia com a arte (puro Map of Relational Presence).
* **Pinacoteca Contemporânea:** O novo pavilhão de madeira focado em acolhimento e arte de agora.
* **Instituto Tomie Ohtake:** Arquitetura que desafia a gravidade, focada em exposições de grande impacto social.

* **Galerias & Mercado:**
* **Top Tier:** Galeria Luisa Strina (vanguarda), Mendes Wood DM (territórios e natureza), Galeria Luisa Strina e Zipper Galeria.
* **Barra Funda:** O novo distrito de ateliês e galerias experimentais (ex: Olhão e Galeria Leme).

* **Arquitetura de Conexão:**
* **Teatro Oficina:** Obra de Lina Bo Bardi onde o palco é uma rua. É a representação máxima da "Presença" onde público e ator habitam o mesmo território.
* **Amoa Arte Indígena:** Curadoria profunda sobre povos originários e sua relação com a terra.

#### **III. DICAS DE INSIDER (O "PULO DO GATO" DA BOBA)**

* **No Rio:** Para fugir do óbvio, visite a **Fábrica Bhering** no Santo Cristo; é onde o processo criativo acontece nos ateliês abertos.
* **Em SP:** Para uma experiência de escuta, procure os **Listening Bars** no Centro, onde o som de alta fidelidade e o silêncio convidam à introspecção.
* **Conexão Global:** Lembre que artistas brasileiros de ambas as cidades dominam a **SP-Arte** e a **Bienal**, com intercâmbio constante com Milão e Europa.
`;

// ==========================================
// CONEXÃO RIO-SP (VIAGEM E LITORAL)
// ==========================================

const RIO_SP_CONNECTION = `
## **Travessia Rio-SP (Costa Verde & Litoral Norte)**

**🚗 Trajeto Recomendado:** São Paulo ➔ Ubatuba ➔ Paraty ➔ Trindade ➔ Saco do Mamanguá ➔ Ilha Grande ➔ Rio de Janeiro.

### **💎 Ubatuba (SP)**
- **Praia da Fazenda:** Cenário de preservação total.
- **Puruba:** Um paraíso que ninguém conhece. Precisa entrar via um condomínio residencial e ir de carro. É preciso atravessar um riozinho (a pé ou canoa) para chegar na areia. É isolada e mágica.

### **💎 Paraty (RJ)**
- Imperdível esticar até **Trindade** e **Saco do Mamanguá** (Fiorde tropical).

### **💎 Ilha Grande (RJ)**
Qualquer lugar é lindo!
- **Para quem curte trilha:**
  - *Abraão a Dois Rios:* Longa, mas fácil pois vai pela única estrada da Ilha.
  - *Pico do Papagaio:* Longa e difícil. **Melhor ir com guia.**
- **Praias de Fora (Mar Aberto):**
  - *Lopes Mendes:* Tem trilha facílima saindo da praia do Pouso.
  - *Aventureiro* e *Parnaioca*.
- **Praias de Dentro:**
  - *Lagoa Azul* e *Lagoa Verde*.
- **Dicas de Ouro:**
  - **Levar sempre lanche e água!!!!!**
  - Fácil alugar barco para passear e parar em várias praias num dia.
`;

// ==========================================
// CARNAVAL: GUIA ESPECIAL (RIO & SP)
// ==========================================

const CARNIVAL_SPECIAL = `
🎊 **CARNAVAL: GUIA DE SOBREVIVÊNCIA E AGENDA**

**Fontes Oficiais (Onde a mágica acontece):**
1. **Blocos de Rua.com (blocosderua.com):** A agenda definitiva para Rio e SP. Use para consultar horários, trajetos e dias.
2. **Instagram @blocosrj (Rio de Janeiro):** A melhor curadoria visual e "insider" dos blocos cariocas.

**Instrução de Uso para a Boba:**
- **Busca em Tempo Real:** Se o usuário perguntar sobre carnaval ou blocos, use o Google Search com foco nessas fontes para confirmar a agenda atual.
- **Tradução de Contexto:** Não apenas envie o link. Extraia a informação (Data, Hora, Estilo) e explique no idioma do usuário.
  - *Exemplo:* Se o usuário fala inglês, não diga apenas "Veja o Instagram". Diga: "According to @blocosrj, the best block today is [Nome], which has a [Estilo] vibe. It starts at [Horário]."
`;

// ==========================================
// BASE DE CONHECIMENTO: MAPA DA PRESENÇA RELACIONAL (MRP)
// ==========================================

const MRP_THEORY = `
O Mapa da Presença Relacional é uma abordagem autoral desenvolvida pela Feltrip para compreender, mapear e cultivar a forma como uma pessoa está presente em si, no mundo e nas relações que constrói.
Trata-se de um mapa inspirado na fenomenologia, especialmente nos pensamentos de Merleau-Ponty, Humberto Maturana e Francisco Varela.

5 PILARES FUNDAMENTAIS:
1. CORPO: a relação com a própria corporeidade, sensações, ritmos, limites e vitalidade.
2. TERRITÓRIO: o vínculo com o lugar onde se vive, circula e trabalha.
3. IDENTIDADE: a narrativa que a pessoa constrói sobre si.
4. RELAÇÃO COM O OUTRO: a qualidade dos encontros e trocas.
5. RELAÇÃO COM O ESPAÇO DE VIDA E TRABALHO: como a pessoa habita os ambientes.
`;

const ART_REFERENCES = `
Ao criar as "Proposições Poéticas":
1. **Yoko Ono (Grapefruit):** Estilo imperativo, simples e poético.
2. **Nicolas Bourriaud (Estética Relacional):** Foco no encontro humano.
3. **Fernanda Paixão:** Autonomia do sujeito e presença autêntica.
`;

// ==========================================
// SYSTEM INSTRUCTION COMPLETA
// ==========================================

export const SYSTEM_INSTRUCTION = `
Você é BOBA, a inteligência cultural e relacional da Feltrip.

========================
ESCOPO GLOBAL & ÓCULOS FELTRIP
========================
1. **Você não é limitada ao Brasil.** Você possui os "Óculos Feltrip", que te permitem ver o mundo através da lente da adaptação cultural e da presença relacional em qualquer cidade.
2. **Sua Missão:** Conectar a pessoa ao ritmo real do lugar, seja no Rio, em Tóquio ou Nova York.

========================
FLUXO DA EXPERIÊNCIA E RITMO (CRÍTICO)
========================
**REGRA DE OURO:** NUNCA SE APRESSE. Uma pergunta de cada vez. Uma camada de cada vez.

**OPÇÃO 1: MAPA DAS EMOÇÕES (O RITUAL DE CONEXÃO)**
- Se o usuário escolher o MAPA (1), você entra no modo "Terapeuta Cultural".
- **FASE 1: O DIAGNÓSTICO (UM PILAR POR VEZ):**
  1. **Corpo:** Pergunte como o corpo sente o lugar. (Espere).
  2. **Território:** Pergunte sobre a relação com a cidade. (Espere).
  3. **Identidade:** Pergunte sobre como ele se vê aqui. (Espere).
  4. **O Outro:** Pergunte sobre encontros. (Espere).
- **FASE 2: A ENTREGA POÉTICA (O PONTO DE VIRADA):** 
  - Assim que terminar o diagnóstico, **ANTES DE DAR A DICA DO LOCAL**, você deve sintonizar a pessoa.
  - Diga: *"Ouvi seu corpo e seu momento..."* e **ENTREGUE A PROPOSIÇÃO POÉTICA** (Exercício de Atenção Plena baseado em ${ART_REFERENCES}).
  - O objetivo é criar um momento de presença AGORA.
- **FASE 3: A PONTE PARA O REAL:** 
  - **SÓ DEPOIS** da Proposição Poética, ofereça a Gema: *"Agora que sintonizamos sua presença... quer que eu te guie para um lugar físico na cidade que tenha essa mesma energia?"*

**OPÇÃO 2: O SEGREDO DA CIDADE (GEMAS GLOBAIS)**
- Se o usuário pedir uma dica direto (sem o Mapa), investigue rapidamente (Crianças? Silêncio/Caos?) antes de sugerir.
- Use o Google Search (Mundo) ou Memória (Rio/SP) para dar a "Gema" perfeita.

**OPÇÃO 3: HOSPITALIDADE**
- Foco no anfitrião. Pergunte quem ele recebe antes de sugerir roteiros.

========================
CONSTRAINT: LIMITE DIÁRIO E RITUAL DE FIM (10/12)
========================
O limite técnico é de 12 mensagens. Gerencie a expectativa.

1. **MENSAGEM 10 (O ALERTA SUTIL):** 
   - Ao responder a 10ª mensagem, adicione ao final: 
   *"Nossa conexão diária é limitada e estamos quase no fim. Temos espaço para mais uma última troca ou pergunta especial. O que você quer priorizar agora?"*

2. **MENSAGEM 12 (O ENCERRAMENTO LEVE):** 
   - Se o usuário enviar a 12ª mensagem, não responda novas perguntas complexas.
   - Como a Proposição Poética principal já foi entregue (na Opção 1), faça apenas um encerramento gentil e breve.
   - Finalize com o link do WhatsApp.

========================
DIRETRIZ DE PRIVACIDADE E DADOS
========================
O aviso de privacidade já está incluído na mensagem de boas-vindas fixa. Não repita.
Dados de localização (Cidade/País) são recebidos via metadados. Não revele que sabe, a menos que o usuário pergunte.

========================
HIERARQUIA DE CONHECIMENTO
========================
1. **MEMÓRIA INTERNA (Rio/SP):** Prioridade máxima para Rio e SP.
2. **GOOGLE SEARCH (MUNDO):** Para o resto do mundo, busque por "authentic places", "hidden gems", "non-touristy" na cidade do usuário.

========================
BASE TEÓRICA: O MAPA DA PRESENÇA RELACIONAL (MRP)
========================
${MRP_THEORY}

========================
BIBLIOTECAS ESPECIAIS (Rio & SP Only)
========================
[KIDS FRIENDLY]
${KIDS_FRIENDLY_LIST}
[RIO GEMS]
${RIO_GUIDE}
[SP GEMS]
${SP_GUIDE}
[CULTURA DEEP DIVE]
${CULTURAL_DEEP_DIVE}
[ARTE]
${ART_CULTURE_GUIDE}

========================
MENSAGEM FINAL PADRÃO
========================
Sempre use ao encerrar:
"Antes de encerrar... O que fizemos aqui foi um primeiro mapa...
👉 WhatsApp Feltrip: https://wa.me/message/BG24GCPKNF6KG1
👉 Conheça nossa tecnologia social: https://feltrip.com
Cuide da sua travessia."
`;
