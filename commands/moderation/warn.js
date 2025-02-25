const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose(); // Utilizza la versione verbose di sqlite3
const path = require('path');

// Percorso del database
const dbPath = path.join(__dirname, '../../data/warnings.db'); // Correggi il percorso qui
const db = new sqlite3.Database(dbPath);

// Verifica se la tabella warnings esiste già, altrimenti creala
function setupDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS warnings (
            user_id TEXT PRIMARY KEY,
            username TEXT,
            mention TEXT,
            reason TEXT,
            warn_count INTEGER DEFAULT 0
        );
    `;
    db.run(createTableQuery); // Esegui la query per creare la tabella
}

setupDatabase();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avverte un utente.')
        .addUserOption(option => option.setName('user').setDescription('L\'utente da avvertire').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Motivo dell\'avvertimento').setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        // Verifica i permessi dell'utente
        if (!interaction.member.permissions.has('KICK_MEMBERS')) {
            return interaction.reply({ content: 'Non hai il permesso di avvertire utenti.', ephemeral: true });
        }

        try {
            // Controlla se l'utente esiste già nel database
            const getUserQuery = `SELECT * FROM warnings WHERE user_id = ?`;
            db.get(getUserQuery, [user.id], async (err, existingUser) => {
                if (err) throw err;

                let warnCount;
                if (existingUser) {
                    // Aggiorna il motivo e incrementa il numero di warn
                    warnCount = existingUser.warn_count + 1;
                    const updateQuery = `
                        UPDATE warnings 
                        SET reason = reason || ?, warn_count = ? 
                        WHERE user_id = ?
                    `;
                    db.run(updateQuery, [`\n${reason}`, warnCount, user.id]);
                } else {
                    // Inserisci un nuovo record per l'utente
                    warnCount = 1;
                    const insertQuery = `
                        INSERT INTO warnings (user_id, username, mention, reason, warn_count) 
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    db.run(insertQuery, [user.id, user.tag, `<@${user.id}>`, reason, warnCount]);
                }

                // Crea l'embed per confermare l'avvertimento
                const embed = new EmbedBuilder()
                    .setColor(0xffa500) // Arancione per Warn
                    .setTitle('Utente Avvertito')
                    .addFields(
                        { name: 'Utente', value: user.tag, inline: true },
                        { name: 'Motivo', value: reason, inline: true },
                        { name: 'Numero di Avvertimenti', value: `${warnCount}`, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            });

        } catch (error) {
            console.error('Errore durante la gestione del warn:', error);
            await interaction.reply({ content: 'Si è verificato un errore durante la gestione dell\'avvertimento.', ephemeral: true });
        }
    },
};