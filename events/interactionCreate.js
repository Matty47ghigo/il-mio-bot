const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Gestione dei comandi slash
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }
        }

        // Gestione dei bottoni
        if (interaction.isButton()) {
            const buttonHandler = interaction.client.commands.get('ticket'); // Assumiamo che il comando ticket gestisca i bottoni
            if (buttonHandler && buttonHandler.closeTicket) {
                try {
                    await buttonHandler.closeTicket(interaction); // Esegue la funzione per chiudere il ticket
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'Si è verificato un errore durante l\'esecuzione dell\'azione.', ephemeral: true });
                }
            }
        }
    },
};