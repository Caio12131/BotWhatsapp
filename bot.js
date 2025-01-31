const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone'); // Importa a biblioteca moment-timezone

const client = new Client({
    puppeteer: {
        headless: true, // Rodar sem interface gráfica
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Adicionar essas opções
    },
    authStrategy: new LocalAuth() // Usar autenticação local para evitar a necessidade de escanear QR frequentemente
});

// Variável para armazenar o horário da última resposta
let ultimaResposta = 0;

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
    const agora = moment.tz('America/Sao_Paulo'); // Pega o horário ajustado para o Brasil
    const hora = agora.hours(); // Hora atual no Brasil

    // Verifica se está no intervalo de 18h às 15h
    if ((hora >= 18 || hora < 15)) {
        // Verifica se já passou 30 minutos desde a última resposta
        if (agora - ultimaResposta >= 30 * 60 * 1000) { // 30 minutos em milissegundos
            ultimaResposta = agora; // Atualiza a última resposta

            console.log(`Mensagem recebida de ${message.from}: ${message.body}`); // Log da mensagem recebida

            const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // Delay de 5 a 10 segundos

            setTimeout(async () => {
                try {
                    const audioPath = './audio.mp3'; // Caminho relativo para o áudio
                    console.log(`Verificando se o arquivo de áudio existe em: ${audioPath}`);
                    
                    // Verificar se o arquivo de áudio existe
                    if (!fs.existsSync(audioPath)) {
                        console.error('Erro: Arquivo de áudio não encontrado!');
                        return;
                    }
            
                    console.log(`Arquivo de áudio encontrado em: ${audioPath}. Enviando áudio para ${message.from} em ${delay / 1000} segundos...`);
            
                    // Usando MessageMedia.fromFilePath para carregar o áudio
                    const media = MessageMedia.fromFilePath(audioPath);
                    
                    console.log('Áudio carregado com sucesso. Enviando...');
            
                    // Enviar áudio
                    await client.sendMessage(message.from, media, { sendAudioAsVoice: true });
                    console.log(`Áudio enviado para ${message.from}`);
                } catch (error) {
                    console.error(`Erro ao enviar áudio: ${error.message}`);
                    console.error(error.stack); // Log completo do erro para rastrear a origem
                }
            }, delay); // Garante o delay de 5 a 10 segundos antes de enviar o áudio

            // Envia uma mensagem automática de texto após receber qualquer mensagem
            await client.sendMessage(message.from, "Mensagem Automática Enviada");
        } else {
            console.log("Aguarde 30 minutos para enviar outra resposta.");
        }
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
