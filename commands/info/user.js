const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Provides information about the user.'),
    async execute(interaction) {
        const user = interaction.user;
        const member = interaction.member;

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`Informazioni su ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Username', value: user.username, inline: true },
                { name: 'Discriminator', value: `#${user.discriminator}`, inline: true },
                { name: 'ID Utente', value: user.id },
                { name: 'Entrato nel server il', value: member.joinedAt.toDateString(), inline: true },
                { name: 'Account creato il', value: user.createdAt.toDateString(), inline: true },
                { name: 'Stato Ban', value: member.bannable ? 'Non bannato' : 'Bannato', inline: true },
                { name: 'Stato Mute', value: member.moderatable ? 'Non mutato' : 'Mutato', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Informazioni utente', iconURL: interaction.guild.iconURL({ dynamic: true }) });

        await interaction.reply({ embeds: [embed] });
    },
};
