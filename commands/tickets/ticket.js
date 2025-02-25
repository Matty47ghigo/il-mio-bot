const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    PermissionsBitField
} = require('discord.js');

// Comando /ticket
const ticketCommand = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Crea un ticket per ottenere assistenza.');

module.exports = {
    data: ticketCommand,
    async execute(interaction) {
        const guild = interaction.guild;
        const channel = interaction.channel;

        try {
            // Verifica se il setup è già stato completato
            if (!await this.isSetupCompleted(guild)) {
                await this.setupGuild(guild);
                return interaction.reply({
                    content: 'Il setup del sistema di ticket è stato completato con successo! Ora puoi usare il comando `/ticket`.',
                    ephemeral: true
                });
            }

            // Verifica che il comando venga eseguito nel canale di supporto
            if (channel.name !== '❓-supporto') {
                return interaction.reply({ content: 'Questo comando può essere eseguito solo nel canale `❓ - Supporto`.', ephemeral: true });
            }

            // Creazione dell'embed
            const embed = new EmbedBuilder()
                .setTitle('Supporto')
                .setDescription('Ti serve aiuto? Nessun problema! Clicca sui pulsanti qua sotto per creare un nuovo ticket dove il nostro staff ti assisterà.')
                .setColor('Blurple')
                .setFooter({
                    text: guild.name,
                    iconURL: guild.iconURL({ dynamic: true }) || null, // Icona del server
                });

            // Creazione dei pulsanti
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create-ticket-appella-sanzione')
                    .setLabel('✉️ Appella una sanzione')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✉️'),
                new ButtonBuilder()
                    .setCustomId('create-ticket-segna-utente')
                    .setLabel('💨 Segnala un utente')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💨'),
                new ButtonBuilder()
                    .setCustomId('create-ticket-altro-supporto')
                    .setLabel('❓ Altro supporto')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('❓')
            );

            // Invio dell'embed e dei pulsanti (visibile a tutti)
            await interaction.reply({ embeds: [embed], components: [buttons] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Si è verificato un errore durante la creazione del ticket.', ephemeral: true });
        }
    },

    // Verifica se il setup è già stato completato
    async isSetupCompleted(guild) {
        // Verifica l'esistenza del canale ❓-supporto
        const supportChannel = guild.channels.cache.find(c => c.name === '❓-supporto');
        if (!supportChannel) return false;

        // Verifica l'esistenza dei ruoli Ticket Admin e Ticket Helper
        const ticketAdminRole = guild.roles.cache.find(r => r.name === 'Ticket Admin');
        const ticketHelperRole = guild.roles.cache.find(r => r.name === '🛠️ Ticket Helper');

        return ticketAdminRole && ticketHelperRole;
    },

    // Esegue il setup iniziale
    async setupGuild(guild) {
        try {
            // Step 1: Verifica l'esistenza del canale ❓-supporto
            const supportChannelName = '❓-supporto';
            let supportChannel = guild.channels.cache.find(c => c.name === supportChannelName);

            if (!supportChannel) {
                // Crea il canale solo se non esiste già
                supportChannel = await guild.channels.create({
                    name: supportChannelName,
                    type: 0, // Text Channel
                    topic: 'Canale principale per richiedere assistenza.',
                    reason: 'Creazione automatica durante la configurazione del sistema di ticket.'
                });

                console.log(`Canale "${supportChannelName}" creato con successo.`);
            } else {
                console.log(`Canale "${supportChannelName}" già esistente.`);
            }

            // Step 2: Creazione dei ruoli Ticket Admin e Ticket Helper (se non esistono)
            const rolesToCreate = [
                { name: 'Ticket Admin', color: 'Red', permissions: [PermissionsBitField.Flags.ManageChannels] },
                { name: '🛠️ Ticket Helper', color: 'Blue', permissions: [] }
            ];

            for (const role of rolesToCreate) {
                const existingRole = guild.roles.cache.find(r => r.name === role.name);
                if (!existingRole) {
                    await guild.roles.create({
                        name: role.name,
                        color: role.color,
                        permissions: role.permissions,
                        reason: 'Creazione automatica durante la configurazione del sistema di ticket.'
                    });
                    console.log(`Ruolo "${role.name}" creato con successo.`);
                } else {
                    console.log(`Ruolo "${role.name}" già esistente.`);
                }
            }

            // Step 3: Impostazione delle autorizzazioni nel canale ❓-supporto
            const ticketAdminRole = guild.roles.cache.find(r => r.name === 'Ticket Admin');
            const ticketHelperRole = guild.roles.cache.find(r => r.name === '🛠️ Ticket Helper');

            if (ticketAdminRole && ticketHelperRole) {
                // Assicurati che le autorizzazioni siano impostate correttamente
                await supportChannel.permissionOverwrites.edit(guild.id, { ViewChannel: false }); // Nascondi il canale a tutti
                await supportChannel.permissionOverwrites.edit(ticketAdminRole, { ViewChannel: true, SendMessages: true }); // Permetti a Ticket Admin
                await supportChannel.permissionOverwrites.edit(ticketHelperRole, { ViewChannel: true, SendMessages: true }); // Permetti a Ticket Helper
                console.log('Autorizzazioni per il canale ❓-supporto impostate correttamente.');
            }
        } catch (error) {
            console.error('Errore durante il setup iniziale:', error);
            throw error; // Rilancia l'errore per gestirlo al livello superiore
        }
    },

    handleTicketCreation: async (interaction) => {
        if (!interaction.isButton()) return;

        const buttonIds = ['create-ticket-appella-sanzione', 'create-ticket-segna-utente', 'create-ticket-altro-supporto'];
        if (!buttonIds.includes(interaction.customId)) return;

        const categoryMap = {
            'create-ticket-appella-sanzione': { label: 'Appella una sanzione', emoji: '✉️' },
            'create-ticket-segna-utente': { label: 'Segnala un utente', emoji: '💨' },
            'create-ticket-altro-supporto': { label: 'Altro supporto', emoji: '❓' },
        };

        const member = interaction.member;
        const category = categoryMap[interaction.customId];

        try {
            // Conferma immediatamente l'interazione
            await interaction.deferReply({ ephemeral: true });

            // Verifica se esiste già un ticket aperto
            const existingTicket = interaction.guild.channels.cache.find(channel => channel.name.startsWith(`ticket-${member.id}`));
            if (existingTicket) {
                return interaction.editReply({ content: `Hai già un ticket aperto: ${existingTicket.toString()}.`, ephemeral: true });
            }

            // Trova il ruolo "🛠️ Ticket Helper"
            const helperRole = interaction.guild.roles.cache.find(role => role.name === '🛠️ Ticket Helper');
            if (!helperRole) {
                return interaction.editReply({ content: 'Il ruolo `🛠️ Ticket Helper` non è stato trovato. Contatta un amministratore.', ephemeral: true });
            }

            // Mostra il form modale
            const modal = new ModalBuilder()
                .setCustomId(`ticket-form-${category.label}`)
                .setTitle(`Form per Ticket - ${category.label}`);

            // Aggiungi input per nome utente, email e motivazione
            const usernameInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('username')
                    .setLabel('Nome Utente Discord')
                    .setStyle(TextInputStyle.Short)
                    .setValue(member.user.tag)
                    .setRequired(true)
            );

            const emailInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('email')
                    .setLabel('Indirizzo Email (opzionale)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('esempio@email.com')
                    .setRequired(false)
            );

            const reasonInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('reason')
                    .setLabel('Motivazione')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Spiega brevemente la tua richiesta...')
                    .setRequired(true)
            );

            modal.addComponents(usernameInput, emailInput, reasonInput);

            // Mostra il form all'utente
            await interaction.showModal(modal);
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Si è verificato un errore durante la creazione del ticket.', ephemeral: true });
        }
    },

    handleTicketFormSubmit: async (interaction) => {
        if (!interaction.isModalSubmit()) return;

        const categoryMap = {
            'ticket-form-Appella una sanzione': { label: 'Appella una sanzione', emoji: '✉️' },
            'ticket-form-Segnala un utente': { label: 'Segnala un utente', emoji: '💨' },
            'ticket-form-Altro supporto': { label: 'Altro supporto', emoji: '❓' },
        };

        const categoryKey = Object.keys(categoryMap).find(key => interaction.customId.startsWith(key));
        if (!categoryKey) return;

        const category = categoryMap[categoryKey];
        const member = interaction.member;

        try {
            // Recupera i dati dal form
            const username = interaction.fields.getTextInputValue('username');
            const email = interaction.fields.getTextInputValue('email') || 'Non fornita';
            const reason = interaction.fields.getTextInputValue('reason');

            // Conferma immediatamente l'interazione
            await interaction.deferReply({ ephemeral: true });

            // Crea il nuovo canale del ticket
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${member.user.username}`,
                type: 0, // Text Channel
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['ViewChannel'],
                    },
                    {
                        id: member.id,
                        allow: ['ViewChannel', 'SendMessages'],
                    },
                    {
                        id: helperRole.id,
                        allow: ['ViewChannel', 'SendMessages'], // Consenti al ruolo di vedere e scrivere
                    },
                    {
                        id: interaction.guild.roles.everyone,
                        deny: ['ViewChannel'],
                    },
                ],
                topic: `Ticket creato da ${member.user.tag} - Categoria: ${category.label}`,
                reason: `Ticket creato da ${member.user.tag} nella categoria: ${category.label}`,
            });

            // Messaggio di benvenuto con embed verde
            const welcomeEmbed = new EmbedBuilder()
                .setTitle('Ticket Creato')
                .setColor('Green')
                .setDescription(`**Categoria:** ${category.emoji} ${category.label}\n\n**Dati forniti:**\n\n Nome Utente: ${username}\n Email: ${email}\n Motivazione: ${reason}`);

            // Tagga l'utente e il ruolo degli adetti ai ticket
            const helperRole = interaction.guild.roles.cache.find(role => role.name === '🛠️ Ticket Helper');
            await ticketChannel.send({
                content: `${member}, grazie per aver creato un ticket! ${helperRole}, vieni richiesto per assistere.`,
                embeds: [welcomeEmbed],
                allowedMentions: { parse: ['roles'] } // Permette di menzionare il ruolo
            });

            // Bottone per chiudere il ticket
            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close-ticket')
                    .setLabel('Chiudi Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            // Invia il bottone per chiudere il ticket
            await ticketChannel.send({ components: [closeRow] });

            // Conferma all'utente che il ticket è stato creato
            await interaction.editReply({ content: `Il tuo ticket è stato creato qui: ${ticketChannel.toString()}`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Si è verificato un errore durante la creazione del ticket.', ephemeral: true });
        }
    },

    closeTicket: async (interaction) => {
        if (!interaction.isButton() || interaction.customId !== 'close-ticket') return;

        const channel = interaction.channel;
        const member = interaction.member;

        try {
            // Conferma immediatamente l'interazione
            await interaction.deferReply({ ephemeral: true });

            // Controlla se il canale è un ticket
            if (!channel.name.startsWith('ticket-')) {
                return interaction.editReply({ content: 'Questo non è un canale di ticket.', ephemeral: true });
            }

            // Verifica i permessi dell'utente
            if (!(channel.name.includes(member.id) || member.permissions.has('ManageChannels'))) {
                return interaction.editReply({ content: 'Non hai il permesso di chiudere questo ticket.', ephemeral: true });
            }

            // Notifica che il ticket verrà chiuso
            await interaction.editReply({ content: 'Il ticket verrà chiuso tra 5 secondi...', ephemeral: true });

            // Attendi 5 secondi prima di eliminare il canale
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (error) {
                    console.error('Errore durante l\'eliminazione del canale:', error);
                    await interaction.followUp({ content: 'Si è verificato un errore durante la chiusura del ticket.', ephemeral: true });
                }
            }, 5000);
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Si è verificato un errore durante la chiusura del ticket.', ephemeral: true });
        }
    },
};