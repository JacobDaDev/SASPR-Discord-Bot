// Embeds again
const { MessageEmbed } = require('discord.js');

// Incase of an error we need to get the error channel
const config = require('../../config/cfg');

module.exports = {
    name: 'ban',
    category: 'Moderation',
    slash: true,
    testOnly: true,
    description: 'Ban a member',
    options: [
        {
            name: 'Person',
            description: 'Person to ban.',
            type: 'USER',
            required: true
        },
        {
            name: 'Reason',
            description: 'Reason for the ban.',
            type: 'STRING',
            required: true
        },
        {
            name: 'Messages',
            description: 'Number of days of messages to delete (default 0).',
            type: 'INTEGER',
            required: false,
            choices: [
                {
                    name: '1',
                    value: 1
                },
                {
                    name: '2',
                    value: 2
                },
                {
                    name: '3',
                    value: 3
                },
                {
                    name: '4',
                    value: 4
                },
                {
                    name: '5',
                    value: 5
                },
                {
                    name: '6',
                    value: 6
                },
                {
                    name: '7',
                    value: 7
                }
            ]
        }
    ],
    callback: async ({ interaction, args, client }) => {
        const [target1, reason, messagesToRemove] = args;
        await interaction.guild.members.fetch(target1);
        const subCommandName = interaction.options._subcommand;
        if (subCommandName === 'tempban') {
            // TODO: Implement temporary ban.
        };
        const target = await interaction.guild.members.cache.get(target1);
        if (!target) {
            return;
        }
        if (interaction) {
            await interaction.reply({ content: 'Loading...', ephemeral: true });
            const invalidPermEmbed = new MessageEmbed()
                .setColor('FF0000')
                .setTitle('Invalid Permissions!')
                .setDescription(`${interaction.member} You don't have the required permissions to use this command.`)
                .setTimestamp()
                .setFooter(interaction.guild.name, client.user.displayAvatarURL());
            // Permission check.
            if (!interaction.member.permissions.has('ADMINISTRATOR' || 'BAN_MEMBERS')) {
                if (!interaction.member.roles.cache.some(role => role.name === config.commandConfig.banMember.allowedRoles ? config.commandConfig.banMember.allowedRoles : config.commandConfig.modRoles)) {
                    await interaction.editReply({ embeds: [invalidPermEmbed] }).catch((err) => {
                        console.error('Error while deleting message: ' + err);
                        const messageDelete = new MessageEmbed()
                            .setColor('FF0000')
                            .setTitle('ERROR!')
                            .addField('Error while deleting message:', `${err}`)
                            .setTimestamp()
                            .setFooter('Time error occured  ', client.user.displayAvatarURL());
                        client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                    });
                    return;
                }
            }
            // If you try to ban yourself
            if (target.id === interaction.member.id) {
                const thatsYouEmbed = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('You can\'t ban yourself')
                    .setDescription(`${interaction.member} I won't let you ban yourself...`)
                    .setTimestamp()
                    .setFooter(interaction.guild.name, client.user.displayAvatarURL());
                await interaction.editReply({ embeds: [thatsYouEmbed] }).catch((err) => {
                    console.error('Error while deleting message: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting message:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                });
                return;
            }
            // If you try to ban a bot
            if (target.bot) {
                const thatsBotEmbed = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('You can\'t ban a bot')
                    .setDescription(`${interaction.member} I won't let you ban me or any of my bot friends...`)
                    .setTimestamp()
                    .setFooter(interaction.guild.name, client.user.displayAvatarURL());
                await interaction.editReply({ embeds: [thatsBotEmbed] }).catch((err) => {
                    console.error('Error while deleting message: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting message:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                });
                return;
            }
            const highestMemberRole = interaction.member.roles.highest;
            const highestTargetRole = target.roles.highest;
            if (highestMemberRole.rawPosition - highestTargetRole.rawPosition <= 0) {
                const hesRankIsHigher = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('That member has a role that is higher than your highes role.')
                    .setDescription(`${interaction.member} The member you tried to warn is a higher rank than you.`)
                    .setTimestamp()
                    .setFooter(interaction.guild.name, client.user.displayAvatarURL());

                await interaction.editReply({ embeds: [hesRankIsHigher] }).catch((err) => {
                    console.error('Error while deleting message: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting message:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                });
                return;
            }
            try {
                await interaction.guild.members.ban(target.id, [messagesToRemove, reason]);
            } catch {
                const banFailed = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('An unknown error occurred when trying to ban that person.')
                    .setDescription(`${interaction.member} I could not ban the mentioned member, he is most likely above my highest rank or I don't have correct permissions.`)
                    .setTimestamp()
                    .setFooter(interaction.guild.name, client.user.displayAvatarURL());

                await interaction.editReply({ embeds: [banFailed] }).catch((err) => {
                    console.error('Error while deleting message: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting message:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                });
                return;
            }
            const successEmbed = new MessageEmbed()
                .setColor('FF0000')
                .setTitle(`${target.user.username} has been banned!`)
                .setDescription(`${interaction.member}, ${target} has been banned.\nReason: ` + '```' + reason + '```')
                .setTimestamp()
                .setFooter(interaction.guild.name, client.user.displayAvatarURL());
            await interaction.editReply({ embeds: [successEmbed], content: 'Done.' });
        }
    }

};
module.exports.config = {
    displayName: 'Ban',
    dbName: 'BAN',
    loadDBFirst: true
};
