const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// Costruttore del comando /select
const selectCommand = new SlashCommandBuilder()
    .setName('select')
    .setDescription('Mostra un menu a selezione con 4 opzioni.');

module.exports = {
    data: selectCommand,
    async execute(interaction) {
        try {
            // Conferma immediatamente l'interazione
            await interaction.deferReply();

            // Creazione del menu a selezione
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select-menu')
                .setPlaceholder('Seleziona un\'opzione...')
                .addOptions(
                    { label: 'Opzione 1', value: 'option-1', emoji: '1️⃣' },
                    { label: 'Opzione 2', value: 'option-2', emoji: '2️⃣' },
                    { label: 'Opzione 3', value: 'option-3', emoji: '3️⃣' },
                    { label: 'Opzione 4', value: 'option-4', emoji: '4️⃣' }
                );

            // Creazione dell'embed principale
            const embed = new EmbedBuilder()
                .setTitle('Seleziona un Opzione')
                .setDescription('Scegli una delle opzioni sottostanti:')
                .setColor('Blurple');

            // Invio del menu a selezione
            await interaction.editReply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(selectMenu)]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Si è verificato un errore durante la creazione del menu.', ephemeral: true });
        }
    },

    handleSelectMenu: async (interaction) => {
        if (!interaction.isStringSelectMenu() || interaction.customId !== 'select-menu') return;

        try {
            // Ottieni l'opzione selezionata
            const selectedOption = interaction.values[0];

            // Invia il messaggio "test" in base all'opzione selezionata
            await interaction.reply({ content: `Hai selezionato: ${selectedOption}. Test!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Si è verificato un errore durante la gestione della selezione.', ephemeral: true });
        }
    },
};