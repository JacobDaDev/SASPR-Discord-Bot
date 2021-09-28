// Embeds again
const { MessageEmbed } = require('discord.js');

// Incase of an error we need to get the error channel
const config = require('../config/cfg');

// Get the mute schema.
const MuteSchema = require('../schemas/mute-schema');

// Get the warning schema.
const WarnSchema = require('../schemas/warnings-schema');

// For handling time.
const ms = require('ms');

const warn = async (member, reason, message, client) => {
    // Create the database info
    try {
        await new WarnSchema({
            userId: member.id,
            userTag: member.user.username,
            guildId: message.guild.id,
            reason,
            staffId: message.member.id,
            staffTag: message.member.tag
        }).save();
    } catch (err) {
        console.error('Erro while adding the warning to database: ' + err);
        const messageDelete = new MessageEmbed()
            .setColor('FF0000')
            .setTitle('ERROR!')
            .addField('Error while adding the warning to database:', `${err}`)
            .setTimestamp()
            .setFooter('Time error occured  ', client.user.displayAvatarURL());
        client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
        return;
    }
    let warningAmount;
    await WarnSchema.find({
        userId: member.id,
        guildId: message.guild.id
    }).then(async (warnings) => {
        warningAmount = await warnings.length;
    });
    const successEmbed = new MessageEmbed()
        .setColor('FF0000')
        .setTitle(`${member.user.username} has been warned!`)
        .setDescription(`${message.member}, ${member} has been warned!\n**Current amount of warnings:** ${warningAmount}\n**Reason for warning:** ${reason}`)
        .setTimestamp()
        .setFooter(message.guild.name, client.user.displayAvatarURL());

    // Log embed.
    const logGRoleEmbed = new MessageEmbed()
        .setColor('1FFF00')
        .setTitle(`${member.user.username} has been warned!`)
        .setDescription(`${message.member} has warned ${member}`)
        .addField('Reason:', reason)
        .addField('Target ID:', `${member.user.id}`)
        .addField('Target username:', `${member.user.username}`)
        .addField('Current amount of warnings user has:', `${warningAmount}`)
        .addField('Warned by ID:', `${message.member.id}`)
        .addField('Warned by username:', `${message.member.username}`)
        .setTimestamp()
        .setFooter(`${message.guild.name}`, client.user.displayAvatarURL());

    if (parseInt(config.commandConfig.warnMember.warnsBeforeMute) !== 0) {
        if (warningAmount >= Number(config.commandConfig.warnMember.warnsBeforeMute)) {
            const mutedRoleConf = config.commandConfig.muteMember.muteRoleName;
            let muterole = await message.guild.roles.cache.find(role => {
                return role.name === mutedRoleConf;
            });
            if (!muterole) {
                try {
                    muterole = await message.guild.roles.create({
                        data: {
                            name: mutedRoleConf,
                            color: '#ff0000',
                            permissions: []
                        }
                    });

                    await message.guild.channels.cache.forEach(async (channel) => {
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
            if (!member.roles.cache.has(muterole.id)) {
                try {
                    await member.roles.add(muterole);
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
            }
            // To get the time mute expires
            const expires = new Date();
            const time1 = expires.getTime();
            const expireTime = time1 + ms('30m');
            expires.setTime(expireTime);
            try {
                await new MuteSchema({
                    userId: member.id,
                    guildId: message.guild.id,
                    reason,
                    time: ms('30m'),
                    staffId: message.member.id,
                    staffTag: message.member.tag,
                    expires,
                    current: true
                }).save();
            } catch (err) {
                console.error('Erro while adding the mute to database: ' + err);
                const messageDelete = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('ERROR!')
                    .addField('Error while adding the mute to database:', `${err}`)
                    .setTimestamp()
                    .setFooter('Time error occured  ', client.user.displayAvatarURL());
                client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                return;
            }
            successEmbed.setTitle(`${member.user.username} has been warned and muted!`);
            successEmbed.setDescription(`${message.member}, ${member} has been warned and muted!\n${member} has been muted due to getting over ${config.commandConfig.warnMember.warnsBeforeMute - 1} warnings.\n**Current amount of warnings:** ${warningAmount}\n**Reason for warning:** ${reason}`);
            successEmbed.addField('Muted for:', '30 Minutes');

            logGRoleEmbed.setTitle(`${member.user.username} has been warned and muted!`);
            logGRoleEmbed.setDescription(`${message.member} has warned and muted ${member}.\n**${member} has been muted due to getting over ${config.commandConfig.warnMember.warnsBeforeMute - 1} warnings.**`);
            logGRoleEmbed.addField('Muted for:', '30 Minutes');
        }
    }

    message.reply({ embeds: [successEmbed] }).then(msg => {
        msg.delete({ timeout: 25000 });
    }).catch((err) => {
        console.error('Error while deleting message: ' + err);
        const messageDelete = new MessageEmbed()
            .setColor('FF0000')
            .setTitle('ERROR!')
            .addField('Error while deleting message:', `${err}`)
            .setTimestamp()
            .setFooter('Time error occured  ', client.user.displayAvatarURL());
        client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
    })
        .then(client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [logGRoleEmbed] }));
};

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
    mute (member, reason, time, role, message, client) {
    // To get the time mute expires
        const expires = new Date();
        const time1 = expires.getTime();
        const expireTime = time1 + time;
        expires.setTime(expireTime);
        // Get the time from milliseconds (which is given by the )

        // Add the mute role to target
        try {
            member.roles.add(role);
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
        // Create the database info
        try {
            new MuteSchema({
                userId: member.id,
                guildId: role.guild.id,
                reason,
                time: time,
                staffId: message.member.id,
                staffTag: message.member.user.username,
                expires,
                current: true
            }).save();
        } catch (err) {
            console.error('Erro while adding the mute to database: ' + err);
            const messageDelete = new MessageEmbed()
                .setColor('FF0000')
                .setTitle('ERROR!')
                .addField('Error while adding the mute to database:', `${err}`)
                .setTimestamp()
                .setFooter('Time error occured  ', client.user.displayAvatarURL());
            client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
            return;
        }

        try {
        // Remove the role after time has passed
            setTimeout(async () => {
                await member.roles.remove(role.id);
            }, time);
        } catch (err) {
            console.error('Erro while removing roles: ' + err);
            const messageDelete = new MessageEmbed()
                .setColor('FF0000')
                .setTitle('ERROR!')
                .addField('Error while removing mute role:', `${err}`)
                .setTimestamp()
                .setFooter('Time error occured  ', client.user.displayAvatarURL());
            client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
            return;
        }
        const logMuteEmbed = new MessageEmbed()
            .setColor('FF0000')
            .setTitle(`${member.user.username} has been muted!`)
            .setDescription(`${message.member} has muted ${member}`)
            .addField('Reason:', `${reason}`)
            .addField('Duration:', `${timeConversion(time)}`)
            .addField('Started at:', `${new Date()}`)
            .addField('Expires at:', `${expires}`)
            .addField('Target ID:', `${member.id}`)
            .addField('Target username:', `${member.user.username}`)
            .addField('Executor ID:', `${message.member.id}`)
            .addField('Executor username:', `${message.member.user.username}`)
            .setFooter(`${message.guild.name}`, client.user.displayAvatarURL())
            .setTimestamp();

        client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [logMuteEmbed] });
    },

    // /////////////////////////////////////////////////////////////////////
    // ///       Warn member
    // ///       Warn Member
    // /////////////////////////////////////////////////////////////////////

    warn
};
