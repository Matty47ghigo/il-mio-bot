const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');
const { exec } = require('child_process'); // Modulo per eseguire comandi shell

// Avvia il server web per mantenere il bot attivo
require('./keep_alive');

// Carica i comandi slash
require('./deploy-commands');

// Funzione per riavviare il bot
function restartBot() {
    console.log('Il bot sta riavviando...');
    exec('node .', (error, stdout, stderr) => {
        if (error) {
            console.error(`Errore durante il riavvio: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Errore standard: ${stderr}`);
            return;
        }
        console.log(`Output: ${stdout}`);
    });
}

// Gestione degli errori globali
process.on('uncaughtException', (error) => {
    console.error('Eccezione non catturata:', error);
    console.error('Riavvio del bot a causa di un errore irreversibile.');
    restartBot();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rifiuto non gestito:', promise, 'Motivo:', reason);
    console.error('Riavvio del bot a causa di un errore irreversibile.');
    restartBot();
});

// Configurazione del client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // Necessario per alcune operazioni con i ruoli/membri
    ],
});

client.commands = new Collection();

// Caricamento dei comandi
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] Il comando in ${filePath} manca della proprietà "data" o "execute".`);
        }
    }
}

// Caricamento degli eventi
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Gestione delle interazioni
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        // Gestione dei comandi slash
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Si è verificato un errore durante l\'esecuzione del comando.', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        // Gestione dei pulsanti
        for (const [commandName, command] of client.commands.entries()) {
            if ('handleTicketCreation' in command && ['create-ticket-appella-sanzione', 'create-ticket-segna-utente', 'create-ticket-altro-supporto'].includes(interaction.customId)) {
                await command.handleTicketCreation(interaction); // Gestione della creazione del ticket
            }

            if ('closeTicket' in command && interaction.customId === 'close-ticket') {
                await command.closeTicket(interaction); // Gestione della chiusura del ticket
            }
        }
    } else if (interaction.isModalSubmit()) {
        // Gestione della sottomissione del form
        for (const [commandName, command] of client.commands.entries()) {
            if ('handleTicketFormSubmit' in command) {
                await command.handleTicketFormSubmit(interaction);
            }
        }
    }
});

// Riavvio Periodico (opzionale)
// Imposta un intervallo di riavvio periodico (ad esempio, ogni 30 secondi)
const RESTART_INTERVAL = 60 * 1000; // 30 secondi in millisecondi
setInterval(() => {
    console.log('Riavvio periodico del bot...');
    restartBot();
}, RESTART_INTERVAL);

// Login del bot
client.login(token);

// Arresto pulito del processo quando il bot si riavvia
process.on('SIGINT', () => {
    console.log('Arresto pulito del bot...');
    client.destroy(); // Distruggi il client Discord
    process.exit(0); // Esci dal processo
});