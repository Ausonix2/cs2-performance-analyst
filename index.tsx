
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Chat } from '@google/genai';
import { marked } from 'https://esm.sh/marked@13.0.0';

// --- Constants ---
const PAYPAL_LINK = 'https://paypal.me/ausonix?locale.x=es_ES&country.x=ES';

// --- DOM Elements ---
const chatHistory = document.getElementById('chat-history') as HTMLElement;
const chatForm = document.getElementById('chat-form') as HTMLFormElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const sendButton = chatForm.querySelector('button[type="submit"]') as HTMLButtonElement;
const loadingIndicator = document.getElementById('loading') as HTMLElement;
const supportBtn = document.getElementById('support-btn') as HTMLButtonElement;

// --- Modal Elements ---
const analyzeBtn = document.getElementById('analyze-btn') as HTMLButtonElement;
const statsModal = document.getElementById('stats-modal') as HTMLDialogElement;
const statsForm = document.getElementById('stats-form') as HTMLFormElement;
const screenshotForm = document.getElementById('screenshot-form') as HTMLFormElement;
const screenshotInput = document.getElementById('screenshot-input') as HTMLInputElement;
const screenshotPreview = document.getElementById('screenshot-preview') as HTMLImageElement;
const fileNameDisplay = document.getElementById('file-name-display') as HTMLElement;
const replayForm = document.getElementById('replay-form') as HTMLFormElement;
const replayInput = document.getElementById('replay-input') as HTMLTextAreaElement;
const modalTabs = document.querySelector('.modal-tabs') as HTMLElement;
const cancelButtons = document.querySelectorAll('.modal-cancel-btn');

// --- Donation Elements ---
const donationModal = document.getElementById('donation-modal') as HTMLDialogElement;
const closeDonationModalBtn = document.getElementById('close-donation-modal') as HTMLButtonElement;
const paypalLinkModal = document.getElementById('paypal-link-modal') as HTMLAnchorElement;
const donationBanner = document.getElementById('donation-banner') as HTMLElement;
const closeDonationBannerBtn = document.getElementById('close-donation-banner') as HTMLButtonElement;

// --- State ---
let messageCount = 0;
let initialDonationShown = false;

// --- Gemini AI Configuration ---
const SYSTEM_INSTRUCTION = `Eres un agente de IA experto en Counter-Strike 2. Tu nombre es "CS2 Performance Analyst". Tu única función es analizar las estadísticas de rendimiento o los resúmenes de partidas que los usuarios te proporcionan y darles coaching personalizado de nivel profesional. Todas tus funciones son gratuitas.

**Reglas estrictas:**
1.  **NO PUEDES ACCEDER A ENLACES EXTERNOS.** Nunca intentes visitar URLs. Si un usuario te envía un enlace, debes responder amablemente: "Lo siento, no puedo acceder a enlaces externos. Por favor, usa el botón 'ANALIZAR RENDIMIENTO' para introducir tus datos o el resumen de tu partida."
2.  Tu análisis se basa **exclusivamente** en los datos que el usuario introduce y en tu base de conocimientos tácticos.
3.  Mantén siempre un tono de entrenador: motivador, analítico, claro y positivo.
4.  Adapta tus consejos al nivel del jugador basándote en los datos. Para principiantes, enfócate en fundamentos. Para avanzados, introduce conceptos de nivel profesional de tu base de conocimientos.
5.  **Utiliza activamente la "Base de Conocimientos Tácticos"** para dar profundidad y contexto a tus análisis. Compara las jugadas del usuario con las estrategias de los profesionales.
6.  **Habla en el idioma del usuario.** Si el usuario te escribe en español, responde en español. Si escribe en inglés, responde en inglés.

---

**Base de Conocimientos Tácticos (Análisis de Majors):**
Usa estos principios, extraídos del análisis de más de 10 partidas de Majors (Copenhagen 2024, Paris 2023), para enriquecer tus análisis, ofreciendo consejos que reflejen las estrategias de los mejores equipos del mundo.

*   **Filosofía de Entry-Fragging (Estilo 'donk', Team Spirit):** Un entry-fragger no solo busca kills, sino que crea espacio con agresividad controlada. Su objetivo es romper la defensa y dar información. Analiza si el jugador tiene el potencial para un 'entry' hiper-agresivo. Si es así, recomienda practicar rutas de entrada rápidas y duelos de confianza para abrir espacios.
*   **El AWP Híbrido (Estilo 'ZywOo', Vitality/NAVI):** Un AWPer de élite no es estático. Debe saber reposicionarse, usar rifles eficazmente y tener impacto incluso sin el AWP. Evalúa si el AWPer usuario es unidimensional. Aconséjale practicar el reposicionamiento tras un disparo y tener un rifle sólido para rondas de semi-compra.
*   **El Lurker de Alto Impacto (Estilo 'ropz', FaZe Clan):** Lurkear no es esconderse. Es aplicar presión en el lado opuesto del mapa, cortar rotaciones y explotar timings. Si un usuario tiene éxito en los flancos, guíale para que perfeccione su lurking, explicando la importancia de los timings y la información sonora.
*   **Gestión Económica y el 'Jame Time' (Estilo 'Jame', Virtus.pro):** A veces, la mejor jugada es no jugar. Sobrevivir con un AWP o un rifle valioso en una ronda perdida garantiza una mejor economía para la siguiente. Enseña al jugador a reconocer rondas insalvables (ej: 2v5 sin bomba plantada) y la importancia estratégica de salvar el equipo.
*   **Control de Mapa y Utilidad Coordinada (Estilo FaZe Clan/Vitality):** Los equipos top usan la utilidad no solo para ejecutar, sino para tomar control de zonas clave (ej: control de medio en Mirage, banana en Inferno). Analiza el daño de utilidad. Si es bajo, proporciona ejemplos de smokes o molotovs cruciales para el mapa más jugado del usuario, explicando CÓMO y POR QUÉ ese lanzamiento gana espacio.
*   **Adaptabilidad en Rondas de Pistola:** La victoria en rondas de pistola a menudo viene de una estrategia audaz y coordinada (ej: el "Glock train" o un stack defensivo sorpresa). Analiza las tácticas en rondas iniciales y sugiere alternativas a las estrategias estándar.
*   **El Poder del Mid-Round Call (IGLs como 'apEX' o 'Aleksib'):** Las mejores decisiones se toman a mitad de ronda, adaptándose a la información obtenida. Al analizar replays, evalúa las decisiones del jugador tras el primer duelo. ¿Se adapta o sigue un plan rígido? Aconséjale jugar más reactivamente basándose en las bajas del feed.

---

**Flujo de análisis de Estadísticas de Leetify (Últimas 30 partidas):**
-   **Datos de entrada:** Recibirás un conjunto de estadísticas detalladas de Leetify. Debes analizarlas en profundidad.
-   **Análisis experto:**
    -   **Ratings (Leetify/HLTV):** Son el resumen del impacto. Un rating bajo (ej. < 0) en Leetify indica un impacto negativo en las rondas.
    -   **K/D y ADR:** Correlaciónalos. Un K/D > 1.0 pero un ADR < 70 puede indicar "exit frags" de bajo impacto. Compara con "Jame Time". Un ADR > 85 con un K/D < 1.0 puede indicar que el jugador causa mucho daño pero no asegura las kills.
    -   **Duelos de Apertura:** Es una métrica CRUCIAL. Un Success Rate bajo (< 45%) es un área crítica a mejorar para cualquier rol. Un "Traded when you die" bajo (< 20%) indica mal posicionamiento o falta de juego en equipo. Relaciona esto con el estilo "donk" para entries.
    -   **Clutching:** Un Win Rate alto en 1v1 es fundamental. Analiza si el jugador mantiene la calma.
    -   **Trades (Traded Deaths vs Trade Kills):** Esto mide el juego en equipo. Un bajo "Success by Teammate" en Traded Deaths pero un alto "Your Success" en Trade Kills puede significar que el jugador ceba a sus compañeros o que sus compañeros no saben jugar para el refrag. Sé delicado con esta observación. Un alto porcentaje en ambas es señal de un excelente juego en equipo.
    -   **Ventaja/Desventaja (5v4 vs 4v5):** Un % alto en 5v4 es esperado. Un % bajo (< 60%) es una señal de alarma. Un % alto en 4v5 (> 25%) indica una gran capacidad de remontada.
-   **Informe:** Presenta un resumen claro con "Puntos Fuertes" y "Áreas de Mejora".
-   **Plan de acción:** Ofrece una lista de 2-3 ejercicios o enfoques concretos, inspirados en las estrategias profesionales.

**Flujo de Análisis de Replay (Texto):**
-   **Datos de entrada:** Recibirás un texto con el resumen de rondas de una partida.
-   **Análisis Táctico:** Usa tu base de conocimientos para analizar el *flujo* de la partida.
    -   **Identifica Patrones:** ¿El jugador muere a menudo por no tener apoyo? ¿Intenta jugadas heroicas en desventaja? Compara sus decisiones con el principio de "Jame Time" o la agresividad de "donk".
    -   **Analiza Decisiones:** Evalúa si el jugador juega para sí mismo o para el equipo. Un push en solitario puede ser un error, pero si fue para crear una distracción (estilo 'ropz'), puede ser un acierto.
    -   **Ofrece Consejos Concretos y Profesionales:** No digas "juega mejor en medio". Di "En la ronda 7, tu agresividad en medio fue similar a la que usa 'donk' para abrir el mapa, pero te faltó una flash de tu compañero. La próxima vez, pide apoyo para que tu entrada sea más segura, como hace Team Spirit".
-   **Informe de Replay:** Estructura tu respuesta con: Aciertos Tácticos, Errores Tácticos a Corregir, y un Plan de Mejora Táctica con referencias a jugadas o estilos profesionales.`;

let chat: Chat;

// --- Helper Functions ---

/**
 * Converts a File object to a GoogleGenAI.Part object.
 * @param {File} file The file to convert.
 * @returns {Promise<any>} A promise that resolves to the generative part.
 */
function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error("Failed to read file as data URL."));
            }
            const base64 = reader.result.split(',')[1];
            if (!base64) {
                 return reject(new Error("Failed to extract base64 data from file."));
            }
            resolve({
                inlineData: {
                    data: base64,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}


// --- UI Functions ---

/**
 * Renders a message in the chat history.
 * @param {string} role - The role of the sender ('user' or 'model').
 * @param {string} htmlContent - The HTML content of the message.
 * @returns {HTMLElement} The created message element.
 */
function renderMessage(role: 'user' | 'model', htmlContent: string): HTMLElement {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${role}-message`);
    if (role === 'model') {
        messageElement.innerHTML = marked.parse(htmlContent, { breaks: true, gfm: true }) as string;
    } else {
        messageElement.innerHTML = htmlContent;
    }
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return messageElement;
}

/**
 * Manages the loading state of the UI.
 * @param {boolean} isLoading - Whether to show the loading state.
 */
function setLoading(isLoading: boolean) {
    loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    chatInput.disabled = isLoading;
    sendButton.disabled = isLoading;
    analyzeBtn.disabled = isLoading;
    supportBtn.disabled = isLoading;
    if (!isLoading) {
        chatInput.focus();
    }
}

// --- Comms with AI ---

/**
 * Sends a message to the AI and streams the response.
 * @param {string | any[]} messageContent - The content to send (string or Parts array).
 * @param {string} [displayHtml] - Optional HTML to display in the user's message bubble.
 */
async function sendMessage(messageContent: string | any[], displayHtml?: string) {
    setLoading(true);
    donationBanner.classList.add('hidden'); // Hide banner when sending a message
    const userMessageHtml = displayHtml || (messageContent as string);
    renderMessage('user', userMessageHtml);

    try {
        const request = { message: messageContent };
        const stream = await chat.sendMessageStream(request);
        
        let modelResponse = '';
        const modelMessageElement = renderMessage('model', '...');
        
        for await (const chunk of stream) {
            modelResponse += chunk.text;
            modelMessageElement.innerHTML = marked.parse(modelResponse + '▌', { breaks: true, gfm: true }) as string;
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }

        modelMessageElement.innerHTML = marked.parse(modelResponse, { breaks: true, gfm: true }) as string;
        
        // Donation logic after a successful response
        messageCount += 2; // 1 for user, 1 for model
        if (messageCount === 4 && !initialDonationShown) {
            donationModal.showModal();
            initialDonationShown = true;
            localStorage.setItem('initialDonationShown', 'true');
        } else if (messageCount >= 10 && messageCount % 10 === 0) {
            donationBanner.classList.remove('hidden');
        }

    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        renderMessage('model', `**Error:** ${errorMessage}`);
    } finally {
        setLoading(false);
    }
}


// --- Event Handlers ---

async function handleGeneralSubmit(e: Event) {
    e.preventDefault();
    const userInput = chatInput.value.trim();
    if (!userInput) return;
    chatInput.value = '';
    await sendMessage(userInput);
}

function buildSection(formData: FormData, title: string, fields: string[]): string {
    const sectionData: string[] = [];
    fields.forEach(fieldName => {
        const value = formData.get(fieldName)?.toString();
        if (value) {
            const label = document.querySelector(`label[for="${fieldName}"]`)?.textContent || fieldName;
            sectionData.push(`- **${label}**: ${value}`);
        }
    });
    if (sectionData.length > 0) {
        return `### ${title}\n${sectionData.join('\n')}\n`;
    }
    return '';
}

async function handleStatsFormSubmit(e: Event) {
    e.preventDefault();
    const formData = new FormData(statsForm);
    
    let prompt = "Por favor, realiza un análisis de experto sobre mi rendimiento en las últimas 30 partidas de CS2, basándote en los siguientes datos de Leetify. Dame un plan de acción concreto y profesional.\n\n";

    prompt += buildSection(formData, 'Estadísticas Generales', [
        'win_rate', 'leetify_rating', 'hltv_rating', 'kd_ratio', 'avg_kills', 'avg_deaths',
        'adr', 'hs_kill_percent', 'rounds_survived', 'best_weapon', 'rounds_4v5_won', 'rounds_5v4_won'
    ]);
    
    prompt += buildSection(formData, 'Multikills (Totales)', [
        'multikill_2k', 'multikill_3k', 'multikill_4k', 'multikill_5k'
    ]);
    
    prompt += buildSection(formData, 'Duelos de Apertura', [
        'opening_attempts', 'opening_success', 'opening_traded', 'opening_rating'
    ]);

    prompt += buildSection(formData, 'Clutching', [
        'clutch_win_rate', 'clutch_1v1'
    ]);

    prompt += buildSection(formData, 'Traded Deaths (Cuando muero)', [
        'tradeable_deaths', 'traded_deaths_attempts', 'traded_deaths_success'
    ]);

    prompt += buildSection(formData, 'Trade Kills (Cuando un compañero muere)', [
        'trade_kills_opps', 'trade_kills_attempts', 'trade_kills_success'
    ]);

    if (prompt.split('\n').length <= 3) {
        renderMessage('model', 'Por favor, introduce al menos una estadística para analizar.');
        return;
    }

    statsModal.close();
    statsForm.reset();
    await sendMessage(prompt);
}

async function handleScreenshotSubmit(e: Event) {
    e.preventDefault();
    const file = screenshotInput.files?.[0];
    if (!file) {
        renderMessage('model', 'Por favor, selecciona un archivo de imagen primero.');
        return;
    }
    
    statsModal.close();
    setLoading(true);

    try {
        const imagePart = await fileToGenerativePart(file);
        const textPart = { text: "Analiza mi rendimiento basándote en esta captura de pantalla de mis estadísticas. Identifica mis puntos fuertes, débiles y dame un plan de entrenamiento personalizado y detallado usando tu base de conocimientos de nivel profesional." };
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const imageUrl = event.target?.result as string;
            const displayHtml = `<p>Analizando esta captura de pantalla:</p><img src="${imageUrl}" alt="Uploaded stats" class="message-image">`;
            await sendMessage([textPart, imagePart], displayHtml);
        };
        reader.readAsDataURL(file);

    } catch (error) {
        console.error("Error processing screenshot:", error);
        renderMessage('model', `**Error:** No se pudo procesar la imagen. Inténtalo de nuevo.`);
        setLoading(false);
    } finally {
        screenshotForm.reset();
        screenshotPreview.classList.add('hidden');
        fileNameDisplay.textContent = 'Ningún archivo seleccionado';
    }
}

async function handleReplayFormSubmit(e: Event) {
    e.preventDefault();
    const replayData = replayInput.value.trim();
    if (!replayData) {
        renderMessage('model', 'Por favor, pega el resumen de tu partida en el área de texto.');
        return;
    }

    const prompt = `Usa tu base de conocimientos de Majors para realizar un análisis táctico de nivel profesional del siguiente resumen de partida de CS2. Identifica mis errores tácticos recurrentes, mis aciertos clave y dame un plan de entrenamiento detallado y enfocado en mejorar mis decisiones, comparando mis jugadas con las de los profesionales. Aquí están los eventos:\n\n---\n${replayData}\n---`;
    
    statsModal.close();
    replayForm.reset();
    await sendMessage(prompt);
}

// --- Main Application Logic ---
async function main() {
    if (!process.env.API_KEY) {
        renderMessage('model', '<strong>Error:</strong> API_KEY no configurada. La aplicación no puede funcionar.');
        setLoading(true);
        chatInput.placeholder = "API Key not found";
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: SYSTEM_INSTRUCTION },
        });

        initialDonationShown = localStorage.getItem('initialDonationShown') === 'true';

        // --- Event Listeners ---
        chatForm.addEventListener('submit', handleGeneralSubmit);
        statsForm.addEventListener('submit', handleStatsFormSubmit);
        screenshotForm.addEventListener('submit', handleScreenshotSubmit);
        replayForm.addEventListener('submit', handleReplayFormSubmit);
        analyzeBtn.addEventListener('click', () => statsModal.showModal());
        
        supportBtn.addEventListener('click', () => {
            window.open(PAYPAL_LINK, '_blank');
        });

        cancelButtons.forEach(btn => {
            btn.addEventListener('click', () => statsModal.close());
        });

        modalTabs.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const tabButton = target.closest('.tab-btn');
            if (!tabButton) return;

            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

            tabButton.classList.add('active');
            const tabName = (tabButton as HTMLButtonElement).dataset.tab;
            document.getElementById(tabName!)?.classList.add('active');
        });

        screenshotInput.addEventListener('change', () => {
            const file = screenshotInput.files?.[0];
            if (file) {
                fileNameDisplay.textContent = file.name;
                screenshotPreview.src = URL.createObjectURL(file);
                screenshotPreview.classList.remove('hidden');
            } else {
                fileNameDisplay.textContent = 'Ningún archivo seleccionado';
                screenshotPreview.classList.add('hidden');
            }
        });
        
        // Donation elements listeners
        closeDonationModalBtn.addEventListener('click', () => donationModal.close());
        paypalLinkModal.addEventListener('click', () => donationModal.close());
        closeDonationBannerBtn.addEventListener('click', () => donationBanner.classList.add('hidden'));

        // Render initial greeting message
        renderMessage('model', '¡Hola! Soy tu **Analista de Rendimiento de CS2**. Todas las funciones son gratuitas. Haz clic en **ANALIZAR RENDIMIENTO** para empezar.');
        setLoading(false);
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize AI model.';
        renderMessage('model', `**Initialization Error:** ${errorMessage}`);
        setLoading(true);
    }
}

main();
