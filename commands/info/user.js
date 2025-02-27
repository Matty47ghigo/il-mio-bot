const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const warningsPath = path.join(__dirname, '../../data/warnings.json'); // Percorso corretto
const warnings = require(warningsPath);
module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Provides information about the user.')
        .addUserOption(option => option.setName('user').setDescription('L\'utente di cui mostrare le informazioni')),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const user = interaction.options.getUser('user') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id);
            const banStatus = member.bannable ? 'Non bannato' : 'Bannato';
            const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
            const muteStatus = muteRole && member.roles.cache.has(muteRole.id) ? 'Mutato' : 'Non mutato';
            const warnStatus = warnings[user.id] ? warnings[user.id].length : 0;
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`Informazioni su ${user.username}`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Username', value: user.username, inline: true },
                    { name: 'Discriminator', value: `#${user.discriminator}`, inline: true },
                    { name: 'ID Utente', value: user.id, inline: true },
                    { name: 'Entrato nel server il', value: member.joinedAt.toDateString(), inline: true },
                    { name: 'Account creato il', value: user.createdAt.toDateString(), inline: true },
                    { name: 'Stato Ban', value: banStatus, inline: true },
                    { name: 'Stato Mute', value: muteStatus, inline: true },
                    { name: 'Numero di Avvertimenti', value: `${warnStatus}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Informazioni utente', iconURL: interaction.guild.iconURL({ dynamic: true }) });
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.editReply({ content: 'Si è verificato un errore durante l\'esecuzione di questo comando!', ephemeral: true });
            } else if (interaction.deferred) {
                await interaction.followUp({ content: 'Si è verificato un errore durante l\'esecuzione di questo comando!', ephemeral: true });
            }
        }
    },
};