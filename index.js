// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config();

const token = process.env.DISCORD_BOT_TOKEN;  // Utilizza la variabile d'ambiente

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
    console.log(`Pronto! Loggato come ${readyClient.user.tag}`);
    readyClient.user.setActivity('una live su Twitch', { type: ActivityType.Watching });
});

client.login(token);

