const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Percorso del database
const dbPath = path.join(__dirname, '../../data/warnings.db'); // Correggi il percorso qui
const db = new sqlite3.Database(dbPath);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Fornisce informazioni sull\'utente.')
        .addUserOption(option => option.setName('user').setDescription('L\'utente di cui mostrare le informazioni')),

    async execute(interaction) {
        await interaction.deferReply(); // Conferma immediatamente l'interazione

        try {
            const user = interaction.options.getUser('user') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id);

            // Verifica lo stato Ban
            const banStatus = member.bannable ? 'Non bannato' : 'Bannato';

            // Verifica lo stato Mute
            const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
            const muteStatus = muteRole && member.roles.cache.has(muteRole.id) ? 'Mutato' : 'Non mutato';

            // Recupera il numero di warn dall'utente nel database
            const getWarningsQuery = `SELECT warn_count FROM warnings WHERE user_id = ?`;
            const warnRow = db.get(getWarningsQuery, [user.id]);
            const warnStatus = warnRow ? warnRow.warn_count : 0;

            // Crea l'embed con le informazioni dell'utente
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
                .setFooter({ 
                    text: 'Informazioni utente', 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                });

            // Invia l'embed come risposta
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Errore durante l\'esecuzione del comando /user:', error);
            if (!interaction.replied) {
                await interaction.editReply({ content: 'Si è verificato un errore durante l\'esecuzione di questo comando!', ephemeral: true });
            } else if (interaction.deferred) {
                await interaction.followUp({ content: 'Si è verificato un errore durante l\'esecuzione di questo comando!', ephemeral: true });
            }
        }
    },
};