// Embeds again
const { MessageEmbed } = require('discord.js');

// Incase of an error we need to get the error channel
const config = require('../config/cfg');

// Users DB
const usersDB = require('../schemas/users.json')
const fs = require('fs');

const warn = async (member, reason, message, client) => {
    // Create the database info
    let amountOfWarnings = await usersDB[member.id].warnings.length;
    usersDB[member.id].warnings[amountOfWarnings] = {
        reason: reason,
        staffID: message.member.id,
        staffTag: message.member.tag,
        date: new Date().toUTCString()
    }
    fs.writeFile('../schemas/users.json', JSON.stringify(usersDB), (err) => {
        if (err) console.error(err);
    });
    amountOfWarnings = await usersDB[member.id].warnings.length;
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
        if (warningAmount >= parseInt(config.commandConfig.warnMember.warnsBeforeMute)) {
            await member.timeout(20 * 60 * 1000, `Too Many Warnings! Reason for last warning ${reason}`);
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
    }).then(client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [logGRoleEmbed] }));
};

module.exports = {
    // /////////////////////////////////////////////////////////////////////
    // ///       Warn member
    // ///       Warn Member
    // /////////////////////////////////////////////////////////////////////
    warn
};
