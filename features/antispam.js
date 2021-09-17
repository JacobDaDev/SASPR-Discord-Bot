const { MessageEmbed } = require('discord.js');

const exportFuctions = require('../features/exports');

// Get the mute schema.
const muteSchema = require('../schemas/mute-schema');

// Used to handle times
const ms = require('ms');

const { bypassRoles, bypassMembers, allowedInvite } = require('../config/cfg');

const config = require('../config/cfg');

module.exports = (client) => {

    const isAllowed = async (message) => {
        for(const role in config.antiAdSpam.bypassRoles) {
            if(message.member.roles.cache.find(role => role.id === config.antiAdSpam.bypassRoles[role])){
                return true;
            }
        }
        for(const member in config.antiAdSpam.bypassMembers) {
            if(message.member.id === member) return true;
        }
        return false;
    };
    const isInvite = async (guild, code) => {
        return await new Promise((resolve) => {
            guild.invites.fetch().then((invites) => {
                for (const invite of invites) {
                    console.log(invite);
                    if (code === invite[0]) {
                        resolve(true);
                        return;
                    }
                }

                resolve(false);
            });
        });
    };

    const words = config.antiAdSpam.restrictedWords.map(function(v) {
        return v.toLowerCase();
    });
    const userMap = new Map();
    client.on('messageCreate', async (message) => {
        try {
            await message.guild.members.fetch(message.author.id)
        }
        catch {
            return;
        }
        if(await message.guild.id !== '806274102327246859') return;
        console.log(message.mentions)
        if(await isAllowed(message)) return;
        
        const { guild, member, content } = message;

        if(message.author.bot) return;
        if(message.mentions.members.length > config.antiAdSpam.amountOfUserMentionsInOneMessage) {
            exportFuctions.warn(member, 'User mention spamming.', message, client);
            message.delete();
        }
        if(message.mentions.roles.length > config.antiAdSpam.amountOfRoleMentionsInOneMessage) {
            exportFuctions.warn(member, 'Role mention spamming.', message, client);
            message.delete();
        }
        if(words.some(w => message.content.toLowerCase().includes(w))) {
            console.log('Bad word detected!');
            const successEmbed = new MessageEmbed()
                .setColor('FF0000')
                .setTitle(`${member.user.username} has been muted for saying a bad word!`)
                .setDescription(`${message.author} has been muted!\n**Reason for mute:** Saying a bad word.`)
                .setTimestamp()
                .setFooter(message.guild.name, client.user.displayAvatarURL());

            // Log embed.
            const logGRoleEmbed = new MessageEmbed()
                .setColor('1FFF00')
                .setTitle(`${member.user.username} has been muted for saying a bad word!`)
                .setDescription(`${client.user.username} has muted ${member}`)
                .addField('Muted for:', '30 Minutes')
                .addField('Reason:', 'Saying a bad word.')
                .addField('Message Content:', content)
                .addField('Target ID:', `${member.id}`)
                .addField('Target username:', `${member.user.username}`)
                .setTimestamp()
                .setFooter(`${message.guild.name}`, client.user.displayAvatarURL());

            const mutedRoleConf = config.commandConfig.muteMember.muteRoleName;
            const target = message.author;
            const memberTarget = message.member;
            let muterole = message.guild.roles.cache.find(role => {
                return role.name == mutedRoleConf;
            });
            if (!muterole) {
                try {
                    muterole = await message.guild.roles.create({
                        data: {
                            name: mutedRoleConf,
                            color: '#ff0000',
                            permissions:[],
                        },
                    });

                    await message.guild.channels.cache.forEach(async (channel) => {
                        await channel.permissionOverwrites.create(muterole, {
                            SEND_MESSAGES: false,
                            MANAGE_MESSAGES: false,
                            READ_MESSAGES: false,
                            ADD_REACTIONS: false,
                        });
                    });
                }
                catch(err) {
                    console.error('Error:' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while trying to find the muted role:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.config.logging.errorChannel).send(messageDelete);
                }
            }
            if(!memberTarget.roles.cache.has(muterole.id)) {
                try {
                    memberTarget.roles.add(muterole);
                }
                catch(err) {
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
            try{
                await new muteSchema({
                    userId: target.id,
                    guildId: message.guild.id,
                    reason: `Saying ${message.content}`,
                    time: ms('30m'),
                    staffId: message.author.id,
                    staffTag: message.author.tag,
                    expires,
                    current: true,
                }).save();
            }
            catch(err) {
                console.error('Erro while adding the mute to database: ' + err);
                const messageDelete = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('ERROR!')
                    .addField('Error while adding the mute to database:', `${err}`)
                    .setTimestamp()
                    .setFooter('Time error occured  ', client.user.displayAvatarURL());
                client.channels.cache.get(config.logging.errorChannel).send({embeds: [messageDelete]});
                return;
            }
            message.channel.send({embeds: [successEmbed]});
            client.channels.cache.get(config.logging.loggingChannel).send({embeds: [logGRoleEmbed]});
            message.delete();
        }

        const code = content.split('discord.gg/')[1];

        if (content.includes('discord.gg/')) {
            const isOurInvite = await isInvite(guild, code);
            if (!isOurInvite && !allowedInvite) {
                if(!member.roles.cache.has(bypassRoles) || !member.id === bypassMembers) {
                    if(message.partial) {
                        console.log('LOL IT\'S A PARTIAL!!!');
                        message.fetch();
                    }
                    member.send(`Do not try to advertise in ${guild.name}.`);
                    const triedAdLog = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('Member tried to send an invite to another discord!')
                        .addField('Member:', `${member}`)
                        .addField('Member ID:', `${member.id}`)
                        .addField('Discord Invite:', `${code}`)
                        .addField('Message Content:', `${content}`)
                        .setTimestamp()
                        .setFooter('Time invite sent ', client.user.displayAvatarURL());
                    await client.channels.cache.get(config.logging.loggingChannel).send({embeds: [triedAdLog]});
                    message.delete();
                }
            }
        }

        if(userMap.has(message.author.id)) {
            const userData = userMap.get(message.author.id);
            let msgCount = userData.msgCount;
            if(msgCount >= config.antiAdSpam.messagesBeforeWarn) {
                console.log('Over the limit!');
                if(!member.roles.cache.has(bypassRoles) || !member.id === bypassMembers) {
                    exportFuctions.warn(member, 'Spamming.', message, client);
                    message.delete();
                }
            }
            else {
                msgCount++;
                userData.msgCount = msgCount;
                userMap.set(message.author.id, userData);
            }
        }
        else {
            console.log('Not on map');
            userMap.set(message.author.id, {
                msgCount: 1,
                lastMassage: message,
                timer: null,
            });
            setTimeout(() => {
                userMap.delete(message.author.id);
            }, 5500);
        }
        /* if(userMap.has(message.author.id)) {
            const userData = userMap.get(message.author.id);
            const { lastMessage, timer } = userData;
            const difference = message.createdTimestamp - lastMessage.createdTimestamp;
            let msgCount = userData.msgCount;
            console.log(difference);
    
            if(difference > config.antiAdSpam.timeBetweenMessagesToReset) {
                clearTimeout(timer);
                console.log('Cleared Timeout');
                userData.msgCount = 1;
                userData.lastMessage = message;
                userData.timer = setTimeout(() => {
                    userMap.delete(message.author.id);
                    console.log('Removed from map.')
                }, TIME);
                userMap.set(message.author.id, userData)
            }
            else {
                ++msgCount;
                if(parseInt(msgCount) === config.antiAdSpam.messagesBeforeWarn) {
                    message.reply("Warning: Spamming in this channel is forbidden.");
                    message.channel.bulkDelete(config.antiAdSpam.messagesBeforeWarn);
                } else {
                    userData.msgCount = msgCount;
                    userMap.set(message.author.id, userData);
                }
            }
        }
        else {
            let fn = setTimeout(() => {
                userMap.delete(message.author.id);
                console.log('Removed from map.')
            }, TIME);
            userMap.set(message.author.id, {
                msgCount: 1,
                lastMessage : message,
                timer : fn
            });
        }     */
    });
};
module.exports.config = {
    displayName: 'Antispam',
    dbName: 'TEST',
    // Wait for the database connection to be present
    loadDBFirst: true,
};