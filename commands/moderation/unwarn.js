const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const warningsPath = path.join(__dirname, '../../data/warnings.json'); // Percorso corretto
let warnings = require(warningsPath);
module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Rimuove un avvertimento da un utente.')
        .addUserOption(option => option.setName('user').setDescription('L\'utente da rimuovere l\'avvertimento').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Motivo per rimuovere l\'avvertimento').setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Nessun motivo fornito';
        if (!interaction.member.permissions.has('KICK_MEMBERS')) {
            return interaction.reply({ content: 'Non hai il permesso di rimuovere avvertimenti dagli utenti.', ephemeral: true });
        }
        if (!warnings[user.id] || warnings[user.id].length === 0) {
            return interaction.reply({ content: 'Questo utente non ha avvertimenti.', ephemeral: true });
        }
        warnings[user.id].pop();
        fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
        const embed = new EmbedBuilder()
            .setColor(0x00ff00) // Verde per Unwarn
            .setTitle('Avvertimento Rimosso')
            .addFields(
                { name: 'Utente', value: user.tag, inline: true },
                { name: 'Motivo', value: reason, inline: true },
                { name: 'Numero di Avvertimenti Rimasti', value: `${warnings[user.id].length}`, inline: true }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};