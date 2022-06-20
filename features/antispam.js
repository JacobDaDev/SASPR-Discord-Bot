const { MessageEmbed } = require('discord.js');

const exportFuctions = require('../features/exports');

const { bypassRoles, bypassMembers, allowedInvite } = require('../config/cfg');

const config = require('../config/cfg');

module.exports = (client) => {
    const isAllowed = async (message) => {
        if (message.channel.id === config.antiAdSpam.allowedChannel) return true;
        for (const roleID in config.antiAdSpam.bypassRoles) {
            if (message.member.roles.cache.find(role => role.id === config.antiAdSpam.bypassRoles[roleID])) {
                return true;
            }
        }
        for (const member in config.antiAdSpam.bypassMembers) {
            if (message.member.id === member) return true;
        }
        return false;
    };
    const isInvite = async (guild, code) => {
        return await new Promise((resolve) => {
            guild.invites.fetch().then((invites) => {
                for (const invite of invites) {
                    if (code === invite[0] || code.toLowerCase() === 'sasrp') {
                        resolve(true);
                        return;
                    }
                }

                resolve(false);
            });
        });
    };

    const userMap = new Map();
    client.on('messageCreate', async (message) => {
        if (await isAllowed(message)) return;

        const { guild, member, content } = message;

        if (message.author.bot) return;
        if (message.mentions.members.length > config.antiAdSpam.amountOfUserMentionsInOneMessage) {
            exportFuctions.warn(member, 'User mention spamming.', client, client);
            message.delete();
        }
        if (message.mentions.roles.length > config.antiAdSpam.amountOfRoleMentionsInOneMessage) {
            exportFuctions.warn(member, 'Role mention spamming.', client, client);
            message.delete();
        }

        const code = content.split('discord.gg/')[1];

        if (content.includes('discord.gg/')) {
            const isOurInvite = await isInvite(guild, code);
            if (!isOurInvite && !allowedInvite) {
                if (!member.roles.cache.has(bypassRoles) || !member.id === bypassMembers) {
                    if (message.partial) {
                        message.fetch();
                    }
                    try {
                        member.send(`Do not try to advertise in ${guild.name}.`);
                    } catch {
                        console.log('Couldn\'t send DM.');
                    }
                    const triedAdLog = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('Member tried to send an invite to another discord!')
                        .addField('Member:', `${member}`)
                        .addField('Member ID:', `${member.id}`)
                        .addField('Discord Invite:', `${code}`)
                        .addField('Message Content:', `${content}`)
                        .setTimestamp()
                        .setFooter('Time invite sent ', client.user.displayAvatarURL());
                    await client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [triedAdLog] });
                    message.delete();
                }
            }
        }

        if (userMap.has(message.author.id)) {
            const userData = userMap.get(message.author.id);
            let msgCount = userData.msgCount;
            if (msgCount >= config.antiAdSpam.messagesBeforeWarn) {
                if (!member.roles.cache.has(bypassRoles) || !member.id === bypassMembers) {
                    exportFuctions.warn(member, 'Spamming.', message, client);
                    message.delete();
                }
            } else {
                msgCount++;
                userData.msgCount = msgCount;
                userMap.set(message.author.id, userData);
            }
        } else {
            userMap.set(message.author.id, {
                msgCount: 1,
                lastMassage: message,
                timer: null
            });
            setTimeout(() => {
                userMap.delete(message.author.id);
            }, 5500);
        }   
    });
};
module.exports.config = {
    displayName: 'Antispam',
};