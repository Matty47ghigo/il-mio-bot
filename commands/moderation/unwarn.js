const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Percorso del database
const dbPath = path.join(__dirname, '../../data/warnings.db'); // Correggi il percorso qui
const db = new sqlite3.Database(dbPath);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Rimuove un avvertimento da un utente.')
        .addUserOption(option => option.setName('user').setDescription('L\'utente da cui rimuovere l\'avvertimento').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Motivo per rimuovere l\'avvertimento').setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Nessun motivo fornito';

        // Verifica i permessi dell'utente
        if (!interaction.member.permissions.has('KICK_MEMBERS')) {
            return interaction.reply({ content: 'Non hai il permesso di rimuovere avvertimenti dagli utenti.', ephemeral: true });
        }

        try {
            // Conferma immediatamente l'interazione
            await interaction.deferReply({ ephemeral: true });

            // Controlla se l'utente ha avvertimenti
            const getWarningsQuery = `SELECT warn_count FROM warnings WHERE user_id = ?`;
            const warnRow = db.get(getWarningsQuery, [user.id]);

            if (!warnRow || warnRow.warn_count === 0) {
                return interaction.editReply({ content: 'Questo utente non ha avvertimenti.', ephemeral: true });
            }

            // Rimuovi un warn decrementando il conteggio
            const updatedWarnCount = warnRow.warn_count - 1;

            const updateWarningsQuery = `
                UPDATE warnings 
                SET warn_count = ?, reason = substr(reason, 0, instr(reason || '\n', '\n', -1) 
                WHERE user_id = ?
            `;
            db.run(updateWarningsQuery, [updatedWarnCount, user.id]);

            // Crea l'embed di conferma
            const embed = new EmbedBuilder()
                .setColor(0x00ff00) // Verde per Unwarn
                .setTitle('Avvertimento Rimosso')
                .addFields(
                    { name: 'Utente', value: user.tag, inline: true },
                    { name: 'Motivo', value: reason, inline: true },
                    { name: 'Numero di Avvertimenti Rimasti', value: `${updatedWarnCount < 0 ? 0 : updatedWarnCount}`, inline: true }
                )
                .setTimestamp();

            // Invia l'embed come risposta
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Errore durante la gestione del comando /unwarn:', error);
            await interaction.editReply({ content: 'Si è verificato un errore durante la rimozione dell\'avvertimento.', ephemeral: true });
        }
    },
};