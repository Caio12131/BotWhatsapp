const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const client = new Client({
    puppeteer: {
        headless: true, // Rodar sem interface gráfica
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Adicionar essas opções
    },
    authStrategy: new LocalAuth() // Usar autenticação local para evitar a necessidade de escanear QR frequentemente
});

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
    console.log(`Mensagem recebida de ${message.from}: ${message.body}`); // Log da mensagem recebida
    
    const agora = new Date();
    const hora = agora.getHours();

    // Verifica se está no intervalo de 18h às 8h
    if (hora >= 18 || hora < 12) {
        const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // Delay de 5 a 10 segundos

        setTimeout(async () => {
            try {
                const audioPath = 'C:\\Users\\caioc\\Downloads\\botWhatspp\\audio.mp3'; // Caminho absoluto do arquivo de áudio
                console.log(`Verificando se o arquivo de áudio existe em: ${audioPath}`);
                
                // Verificar se o arquivo de áudio existe
                if (!fs.existsSync(audioPath)) {
                    console.error('Erro: Arquivo de áudio não encontrado!');
                    return;
                }
        
                console.log(`Arquivo de áudio encontrado. Enviando áudio para ${message.from} em ${delay / 1000} segundos...`);
        
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
        }, delay);
        
    }

    // Envia uma mensagem automática de texto após receber qualquer mensagem
    await client.sendMessage(message.from, "Mensagem Automática Enviada");
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
