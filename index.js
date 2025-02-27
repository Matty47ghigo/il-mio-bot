console.log("Preparo il bot...");
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { token } = require('./config.json'); // Carica il token dal file config.json
const auth = require('./auth.json'); // Carica email e password dal file auth.json
const readline = require('readline');

require('./deploy-commands'); // Carica il file deploy-commands.js per registrare i comandi slash
require('./keep_alive'); // Carica il file keep-alive.js per mantenere attivo il bot
// Crea un'interfaccia readline per gestire l'input della console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Funzione per richiedere il login
function requestLogin() {
    return new Promise((resolve, reject) => {
        console.log('Benvenuto! Effettua il login per avviare il bot.');

        // Richiedi l'email
        rl.question('Email: ', (email) => {
            if (email !== auth.email) {
                console.error('Email non valida.');
                rl.close();
                reject(new Error('Accesso negato'));
                return;
            }

            // Richiedi la password
            rl.question('Password: ', (password) => {
                if (password !== auth.password) {
                    console.error('Password non valida.');
                    rl.close();
                    reject(new Error('Accesso negato'));
                    return;
                }

                console.log('Login effettuato con successo!');
                rl.close();
                resolve(true);
            });
        });
    });
}

// Configurazione del client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const express = require('express'); // Importa express
const { Client, Events, GatewayIntentBits, ActivityType, Collection } = require('discord.js');
const { token } = require('./config.json');

// Configurazione del server Express per il keep-alive
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Il bot è attivo!');
});

app.listen(port, () => {
    console.log(`Server HTTP in esecuzione su http://localhost:${port}`);
});

// Configurazione del client Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
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

// Imposta periodicamente lo stato del bot
client.on('ready', () => {
    console.log(`Bot loggato come ${client.user.tag}!`);

    // Funzione per aggiornare lo stato del bot
    function updateBotStatus() {
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0); // Calcola il numero totale di utenti
        client.user.setActivity(`Tickets | ${totalUsers} utenti`, { type: ActivityType.Watching }); // Imposta lo stato
    }

    // Aggiorna lo stato ogni 15 minuti
    setInterval(updateBotStatus, 15 * 60 * 1000);

    // Esegui l'aggiornamento immediatamente al primo avvio
    updateBotStatus();
});

// Funzione principale per avviare il bot
async function startBot() {
    try {
        // Richiedi il login
        await requestLogin();

        // Avvia il bot dopo il login
        client.login(token);
    } catch (error) {
        console.error('Impossibile avviare il bot:', error.message);
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
// Imposta un intervallo di riavvio periodico (ad esempio, ogni 60 secondi)
const RESTART_INTERVAL = 60 * 1000; // 60 secondi in millisecondi
setInterval(() => {
    console.log('Riavvio periodico del bot...');
    restartBot();
}, RESTART_INTERVAL);

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

// Arresto pulito del processo quando il bot si riavvia
process.on('SIGINT', () => {
    console.log('Arresto pulito del bot...');
    client.destroy(); // Distruggi il client Discord
    process.exit(0); // Esci dal processo
});

// Avvia il bot
startBot();