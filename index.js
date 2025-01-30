const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, ActivityType, Collection } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
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
            console.log(`Command ${command.data.name} loaded`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Quando il client è pronto, esegui questo codice una sola volta.
client.once(Events.ClientReady, readyClient => {
    console.log(`Pronto! Loggato come ${readyClient.user.tag}`);
    readyClient.user.setActivity('una live su Twitch', { type: ActivityType.Watching });
});

// Gestione delle interazioni (comandi slash)
client.on(Events.InteractionCreate, async interaction => {
    console.log(`Received interaction: ${interaction.commandName}`); // Log per debug
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.log(`No command found for ${interaction.commandName}`); // Log per debug
        return;
    }

    try {
        await command.execute(interaction);
        console.log(`Executed command ${interaction.commandName}`); // Log per debug
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Effettua il login su Discord con il token del bot
client.login(token);
