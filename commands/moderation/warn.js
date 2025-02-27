const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const warningsPath = path.join(__dirname, '../../data/warnings.json'); // Correggi il percorso qui
let warnings = require(warningsPath);
module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avverte un utente.')
        .addUserOption(option => option.setName('user').setDescription('L\'utente da avvertire').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Motivo dell\'avvertimento').setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        if (!interaction.member.permissions.has('KICK_MEMBERS')) {
            return interaction.reply({ content: 'Non hai il permesso di avvertire utenti.', ephemeral: true });
        }
        if (!warnings[user.id]) {
            warnings[user.id] = [];
        }
        warnings[user.id].push({ reason, date: new Date() });
        fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
        const embed = new EmbedBuilder()
            .setColor(0xffa500) // Arancione per Warn
            .setTitle('Utente Avvertito')
            .addFields(
                { name: 'Utente', value: user.tag, inline: true },
                { name: 'Motivo', value: reason, inline: true },
                { name: 'Numero di Avvertimenti', value: `${warnings[user.id].length}`, inline: true }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};