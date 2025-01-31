const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone'); // Biblioteca para ajustar o fuso horário

const client = new Client({
    puppeteer: {
        headless: true, // Rodar sem interface gráfica
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Evita erros no servidor
    },
    authStrategy: new LocalAuth() // Mantém a autenticação sem precisar escanear QR sempre
});

// Armazena a última data de resposta de cada número
const ultimasRespostas = {};

// Gera QR Code no terminal
client.on('qr', (qr) => {
    console.log('Escaneie o QR Code abaixo para conectar:');
    qrcode.generate(qr, { small: true });
});

// Confirma que o bot está conectado
client.on('ready', () => {
    console.log('Bot do WhatsApp está online!');
});

// Detecta mensagens recebidas
client.on('message', async (message) => {
    const agora = moment.tz('America/Sao_Paulo'); // Pega o horário do Brasil
    const hora = agora.hours(); // Obtém a hora no Brasil
    const dataHoje = agora.format('YYYY-MM-DD'); // Formato de data (ex: 2025-02-01)

    // Obtém o número do remetente
    const numero = message.from;

    // Verifica se está no intervalo de 18h às 15h
    if (hora >= 18 || hora < 15) {
        // Se o número já recebeu resposta hoje, ignora as próximas mensagens
        if (ultimasRespostas[numero] === dataHoje) {
            console.log(`Ignorando mensagem de ${numero}, pois já foi respondido hoje.`);
            return;
        }

        // Atualiza o último dia de resposta para esse número
        ultimasRespostas[numero] = dataHoje;

        console.log(`Mensagem recebida de ${numero}: ${message.body}`);

        const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // Delay de 5 a 10 segundos

        setTimeout(async () => {
            try {
                const audioPath = './audio.mp3'; // Caminho do arquivo de áudio
                console.log(`Verificando se o arquivo de áudio existe em: ${audioPath}`);
                
                // Verificar se o arquivo de áudio existe
                if (!fs.existsSync(audioPath)) {
                    console.error('Erro: Arquivo de áudio não encontrado!');
                    return;
                }
        
                console.log(`Arquivo de áudio encontrado. Enviando para ${numero} em ${delay / 1000} segundos...`);
        
                // Usando MessageMedia.fromFilePath para carregar o áudio
                const media = MessageMedia.fromFilePath(audioPath);
                
                console.log('Áudio carregado com sucesso. Enviando...');
        
                // Enviar áudio
                await client.sendMessage(numero, media, { sendAudioAsVoice: true });
                console.log(`Áudio enviado para ${numero}`);
            } catch (error) {
                console.error(`Erro ao enviar áudio: ${error.message}`);
            }
        }, delay);

        // Envia uma mensagem automática de texto junto com o áudio
        await client.sendMessage(numero, "Mensagem Automática Enviada");
    } else {
        console.log("Fora do intervalo de 18h às 15h, não enviando áudio.");
    }
});

// Para tentar reconectar automaticamente caso o bot seja desconectado
client.on('disconnected', (reason) => {
    console.log('Bot desconectado. Tentando reconectar...', reason);
    client.initialize(); // Reconnecta automaticamente
});

// Inicia o bot
client.initialize();

// Manter o processo rodando na Railway (garante que o processo não será finalizado)
process.on('SIGINT', () => {
    console.log('Processo finalizado');
    client.destroy(); // Finaliza o cliente corretamente antes de sair
});
