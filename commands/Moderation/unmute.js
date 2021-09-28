/* eslint-disable no-unused-expressions */
// Embeds again
const { MessageEmbed } = require('discord.js');

// Incase of an error we need to get the error channel
const config = require('../../config/cfg');

// Importing the mongoose schema for database
const muteSchema = require('../../schemas/mute-schema');

module.exports = {
    name: 'unmute',
    category: 'Moderation',
    slash: true,
    testOnly: true,
    description: 'Unmute a member',
    options: [
        {
            name: 'Person',
            description: 'Person to unmute.',
            type: 'USER',
            required: true
        }
    ],
    callback: async ({ interaction, args, client }) => {
        if (interaction) {
            await interaction.reply({ content: 'Loading...', ephemeral: true });

            const [target] = args;
            // Mute role name.
            const mutedRoleConf = config.commandConfig.muteMember.muteRoleName;
            // Get the mute role.
            const muterole = interaction.guild.roles.cache.find(role => {
                return role.name === mutedRoleConf;
            });

            if (!interaction.member.permissions.has('ADMINISTRATOR' || 'MANAGE_ROLES')) {
                if (!interaction.member.roles.cache.some(role => role.name === config.commandConfig.muteMember.allowedRoles ? config.commandConfig.muteMember.allowedRoles : config.commandConfig.modRoles)) {
                    const invalidPermEmbed = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('Invalid Permissions!')
                        .setDescription(`${interaction.member} You don't have the required permissions to use this command.`)
                        .setTimestamp()
                        .setFooter(interaction.guild.name, client.user.displayAvatarURL());
                    await interaction.editReply({ embeds: [invalidPermEmbed] }).catch((err) => {
                        console.error('Error while deleting interaction: ' + err);
                        const messageDelete = new MessageEmbed()
                            .setColor('FF0000')
                            .setTitle('ERROR!')
                            .addField('Error while deleting interaction:', `${err}`)
                            .setTimestamp()
                            .setFooter('Time error occured  ', client.user.displayAvatarURL());
                        client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                    });
                    return;
                }
            }
            // If client doesn't have the manage roles permission.
            if (!interaction.member.permissions.has('MANAGE_ROLES')) {
                await interaction.editReply('I do not have permission to manage roles.').catch((err) => {
                    console.error('Error while deleting interaction: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting interaction:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                });
                return;
            }
            const targetMember = interaction.guild.members.cache.get(target);

            // If member not found
            if (!targetMember) {
                const noTargetFoundEmbed = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('He isn\'t in this guild.')
                    .setDescription(`${interaction.member} The person you tried to unmute isn't in this guild.`)
                    .setTimestamp()
                    .setFooter(interaction.guild.name, client.user.displayAvatarURL());
                await interaction.editReply({ embeds: [noTargetFoundEmbed] }).catch((err) => {
                    console.error('Error while deleting interaction: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting interaction:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                });
                return;
            }
            // If a person tries to unmute themself.
            if (interaction.member.id === target) {
                const thatsYouEmbed = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('You can\'t unmute yourself')
                    .setDescription(`${interaction.member} I won't let you unmute yourself...`)
                    .setTimestamp()
                    .setFooter(interaction.guild.name, client.user.displayAvatarURL());
                await interaction.editReply({ embeds: [thatsYouEmbed] }).catch((err) => {
                    console.error('Error while deleting interaction: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting interaction:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                });
                return;
            }

            // Get the information from the DB
            const results = await muteSchema.updateMany({
                guildId: interaction.guild.id,
                userId: target,
                current: true
            }, {
                current: false
            });
            const successEmbed = new MessageEmbed()
                .setColor('FF0000')
                .setTitle(`${targetMember.user.username} has been unmuted!`)
                .setDescription(`${interaction.member}, ${targetMember} has been unmuted!`)
                .setTimestamp()
                .setFooter(interaction.guild.name, client.user.displayAvatarURL());
            // Log embed.
            const logMuteEmbed = new MessageEmbed()
                .setColor('FF0000')
                .setTitle(`${targetMember.user.username} has been unmuted!`)
                .setDescription(`${interaction.member} has unmuted ${targetMember}`)
                .addField('Target ID:', `${target}`)
                .addField('Target username:', `${targetMember.user.username}`)
                .addField('Executor ID:', `${interaction.member.id}`)
                .addField('Executor username:', `${interaction.member.user.username}`)
                .setTimestamp()
                .setFooter(`${interaction.guild.name}`, client.user.displayAvatarURL());

            const notMuted = new MessageEmbed()
                .setColor('FF0000')
                .setTitle('You can\'t unmute someone that\'s not muted.')
                .setDescription(`${interaction.member} I cannot unmute someone that is not currently muted...`)
                .setTimestamp()
                .setFooter(interaction.guild.name, client.user.displayAvatarURL());
            if (!results) {
                await interaction.editReply({ embeds: [notMuted] }).catch((err) => {
                    console.error('Error while deleting interaction: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting interaction:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                });
                return;
            }
            if (results.nModified === 1 || targetMember.roles.cache.has(muterole.id)) {
                if (muterole) {
                    try {
                        targetMember.roles.remove(muterole);
                    } catch (err) {
                        console.error('Error while adding roles: ' + err);
                        const messageDelete = new MessageEmbed()
                            .setColor('FF0000')
                            .setTitle('ERROR!')
                            .addField('Error while adding muted role:', `${err}`)
                            .setTimestamp()
                            .setFooter('Time error occured  ', client.user.displayAvatarURL());
                        client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                        return;
                    }
                    // Send the success embed
                    await client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [logMuteEmbed] });

                    await interaction.editReply({ embeds: [successEmbed], content: 'Done.' }).catch((err) => {
                        console.error('Error while deleting interaction: ' + err);
                        const messageDelete = new MessageEmbed()
                            .setColor('FF0000')
                            .setTitle('ERROR!')
                            .addField('Error while deleting interaction:', `${err}`)
                            .setTimestamp()
                            .setFooter('Time error occured  ', client.user.displayAvatarURL());
                        client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                    });
                }
            } else {
                await interaction.editReply({ embeds: [notMuted] }).catch((err) => {
                    console.error('Error while deleting interaction: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting interaction:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                });
            }
        }
    }

};
module.exports.config = {
    displayName: 'Unmute',
    dbName: 'UNMUTE',
    loadDBFirst: true
};
