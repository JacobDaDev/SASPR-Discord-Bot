/* eslint-disable no-unused-expressions */
// Embeds again
const { MessageEmbed } = require('discord.js');

// Incase of an error we need to get the error channel
const config = require('../../config/cfg');

// Used to handle times
const ms = require('ms');

const exportFuctions = require('../../features/exports');
function timeConversion (millisec) {
    const seconds = (millisec / 1000).toFixed(1);

    const minutes = (millisec / (1000 * 60)).toFixed(1);

    const hours = (millisec / (1000 * 60 * 60)).toFixed(1);

    const days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

    if (seconds < 60) {
        return seconds + ' Seconds';
    } else if (minutes < 60) {
        return minutes + ' Minutes';
    } else if (hours < 24) {
        return hours + ' Hours';
    } else {
        return days + ' Days';
    }
}
module.exports = {
    name: 'mute',
    category: 'Moderation',
    slash: true,
    testOnly: true,
    description: 'Mute a member',
    options: [
        {
            name: 'Person',
            description: 'Person to mute.',
            type: 'USER',
            required: true
        },
        {
            name: 'Type of Time',
            description: 'Type of amount of time to mute the person for.',
            type: 'STRING',
            required: true,
            choices: [
                {
                    name: 'Minutes',
                    value: 'm'
                },
                {
                    name: 'Hours',
                    value: 'h'
                },
                {
                    name: 'Days',
                    value: 'd'
                },
                {
                    name: 'Weeks',
                    value: 'w'
                }
            ]
        },
        {
            name: 'Amount of Time',
            description: 'Amount of time to mute the person for.',
            type: 'INTEGER',
            required: true
        },
        {
            name: 'Reason',
            description: 'Reason for the mute.',
            type: 'STRING',
            required: true
        }
    ],
    callback: async ({ interaction, args, client }) => {
        const [target1, typeOfTime, amountOfTime, reason] = args;
        await interaction.guild.members.fetch(target1);
        const target = await interaction.guild.members.cache.get(target1);
        if (!target) {
            return;
        }
        if (interaction) {
            await interaction.reply({ content: 'Loading...', ephemeral: true });
            // Mute role name
            const mutedRoleConf = config.commandConfig.muteMember.muteRoleName;
            // Embeds loaded here so client doesn't have to load them everytime.
            const invalidPermEmbed = new MessageEmbed()
                .setColor('FF0000')
                .setTitle('Invalid Permissions!')
                .setDescription(`${interaction.member} You don't have the required permissions to use this command.`)
                .setTimestamp()
                .setFooter(interaction.guild.name, client.user.displayAvatarURL());
            // Permission check.
            if (!interaction.member.permissions.has('ADMINISTRATOR' || 'MANAGE_ROLES')) {
                if (!interaction.member.roles.cache.some(role => role.name === config.commandConfig.muteMember.allowedRoles ? config.commandConfig.muteMember.allowedRoles : config.commandConfig.modRoles)) {
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
            // Get the mute role.
            let muterole = interaction.guild.roles.cache.find(role => {
                return role.name === mutedRoleConf;
            });

            // If no muterole found
            if (!muterole) {
                try {
                    muterole = await interaction.guild.roles.create({
                        name: mutedRoleConf,
                        color: '#ff0000'
                    });

                    await interaction.guild.channels.cache.forEach(async (channel) => {
                        await channel.permissionOverwrites.create(muterole, {
                            SEND_MESSAGES: false,
                            MANAGE_MESSAGES: false,
                            ADD_REACTIONS: false
                        });
                    });
                } catch (err) {
                    console.error('Error:' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while trying to find the muted role:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                }
            }
            // If you try to mute yourself
            if (target.id === interaction.member.id) {
                const thatsYouEmbed = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('You can\'t mute yourself')
                    .setDescription(`${interaction.member} I won't let you mute yourself...`)
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
            // If you try to mute a bot
            if (target.bot) {
                const thatsBotEmbed = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('You can\'t mute a bot')
                    .setDescription(`${interaction.member} I won't let you mute me or any of my bot friends...`)
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
            if (target.roles.cache.has(muterole.id)) {
                const alreaduMutedEmbed = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('Given user already muted.')
                    .setDescription(`${interaction.member} The user you tried to mute is already muted.`)
                    .setTimestamp()
                    .setFooter(interaction.guild.name, client.user.displayAvatarURL());

                await interaction.editReply({ embeds: [alreaduMutedEmbed] }).catch((err) => {
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
            const time = ms(`${amountOfTime}${typeOfTime}`);
            await exportFuctions.mute(target, reason, time, muterole, interaction, client);
            const successEmbed = new MessageEmbed()
                .setColor('FF0000')
                .setTitle(`${target.user.username} has been muted!`)
                .setDescription(`${interaction.member}, ${target} has been muted for ${timeConversion(time)}.\nReason: ` + '```' + reason + '```')
                .setTimestamp()
                .setFooter(interaction.guild.name, client.user.displayAvatarURL());
            await interaction.editReply({ embeds: [successEmbed], content: 'Done.' });
        }
    }

};
module.exports.config = {
    displayName: 'Mute',
    dbName: 'MUTE',
    loadDBFirst: true
};
