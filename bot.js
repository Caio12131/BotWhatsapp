const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const moment = require('moment-timezone');

const client = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    authStrategy: new LocalAuth()
});

// Usando Set para otimizar a lista de números já respondidos
const numerosRespondidosHoje = new Set();

// Gera QR Code no terminal
client.on('qr', (qr) => {
    console.log('Escaneie o QR Code abaixo para conectar:');
    qrcode.generate(qr, { small: true });
});

// Confirma que o bot está conectado
client.on('ready', () => {
    console.log('Bot do WhatsApp está online!');
});

client.on('message', async (message) => {
    // 🚀 Ignorar mensagens de grupos imediatamente
    if (message.from.endsWith('@g.us')) return;

    const agora = moment.tz('America/Sao_Paulo');
    const hora = agora.hours();
    const dataHoje = agora.format('YYYY-MM-DD');
    const numero = message.from;

    // 🚀 Se já respondeu esse número hoje, nem processa mais nada
    if (numerosRespondidosHoje.has(numero)) return;

    // 🚀 Se estiver fora do horário definido, também não faz nada
    if (hora < 18 && hora >= 8) return;

    // Atualiza a lista de números respondidos
    numerosRespondidosHoje.add(numero);

    console.log(`Mensagem recebida de ${numero}: ${message.body}`);

    const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;

    setTimeout(async () => {
        try {
            const audioPath = './audio.mp3';
            if (!fs.existsSync(audioPath)) return;

            const media = MessageMedia.fromFilePath(audioPath);
            await client.sendMessage(numero, media, { sendAudioAsVoice: true });
            await client.sendMessage(numero, "Mensagem Automática Enviada");

            console.log(`Áudio enviado para ${numero}`);
        } catch (error) {
            console.error(`Erro ao enviar mensagem: ${error.message}`);
        }
    }, delay);
});

// 🚀 Limpa a lista de números respondidos automaticamente todo dia à meia-noite
setInterval(() => {
    numerosRespondidosHoje.clear();
    console.log("Cache de números respondidos foi limpo.");
}, 24 * 60 * 60 * 1000);

client.on('disconnected', (reason) => {
    console.log('Bot desconectado. Tentando reconectar...', reason);
    client.initialize();
});

client.initialize();

process.on('SIGINT', () => {
    console.log('Processo finalizado');
    client.destroy();
});
            