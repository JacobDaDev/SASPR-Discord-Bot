// Importing discord for embeds
const Discord = require('discord.js');

// Import the logging and client error channel
const config = require('../config/cfg');

module.exports = (client) => {
    client.on('error', async (error) => {
        console.error(error);
        const messageDelete = new Discord.MessageEmbed()
            .setColor('FF0000')
            .setTitle('ERROR!')
            .addField('Error:', `${error}`)
            .setTimestamp()
            .setFooter('Time error occured  ', client.user.displayAvatarURL());
        client.channels.cache.get(config.logging.errorChannel).send({ embeds: [messageDelete] });
    });

    client.on('shardError', async (error) => {
        console.error('A websocket connection encountered an error:', error);
        const messageDelete = new Discord.MessageEmbed()
            .setColor('FF0000')
            .setTitle('SHARD ERROR!')
            .addField('Error:', `${error}`)
            .setTimestamp()
            .setFooter('Time error occured  ', client.user.displayAvatarURL());
        client.channels.cache.get(config.logging.errorChannel).send({ embeds: [messageDelete] });
    });

    process.on('unhandledRejection', error => {
        console.error('Unhandled promise rejection:', error);
        const messageDelete = new Discord.MessageEmbed()
            .setColor('FF0000')
            .setTitle('API ERROR!')
            .addField('Error:', `${error}`)
            .setTimestamp()
            .setFooter('Time error occured  ', client.user.displayAvatarURL());
        client.channels.cache.get(config.logging.errorChannel).send({ embeds: [messageDelete] });
    });

    // Message deleted log
    client.on('messageDelete', async (message) => {
        if (message.channel.type === 'dm') return;
        // Sometimes the message isn't cached so we need to use partials to cache it.
        if (message.partial) {
            // Add latency as audit logs aren't instantly updated, adding a higher latency will result in slower logs, but higher accuracy.
            await Discord.Util.delayFor(900);

            // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
            const fetchedLogs = await message.guild.fetchAuditLogs({
                limit: 6,
                type: 72
            }).catch(() => ({
                entries: []
            }));
            const auditEntry = fetchedLogs.entries.find(a =>
                // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
                a.extra.channel.id === message.channel.id &&
                // Ignore entries that are older than 20 seconds to reduce false positives.
                Date.now() - a.createdTimestamp < 20000
            );
            let executor = '';

            // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'.
            executor = auditEntry ? auditEntry.executor : 'Unknown, most likely deleted by bot.';

            // Message deleted embed
            const messageDelete = new Discord.MessageEmbed()
                .setColor('FF0000')
                .setAuthor('The information for this message was limited so some of the information might be false or unknown. (Click me if you want to see a post made by me about this.)', client.user.displayAvatarURL(), 'https://github.com/JacobsonDaMan/NM-bot-NOT-PUBLIC/issues/1#issue-807976965')
                .setTitle('Message Deleted!')
                .addField('Message by:', `${message.author || 'Unknown'}`)
                .addField('Message content:', `${message.content || 'Unknown'}`)
                .addField('Message deleted by:', `${executor}`)
                .setTimestamp()
                .setFooter('Time message deleted  ', client.user.displayAvatarURL());
            if (executor !== 'Unknown, most likely deleted by bot.') {
                messageDelete.addField('Message deleted by user ID:', `${executor.id}`);
            } else {
                messageDelete.addField('Message deleted by user ID:', 'Unknown');
            }
            await client.channels.cache.get(config.logging.messageLoggingChannel).send({ embeds: [messageDelete] });
        } else {
            if (!message.guild) return;
            if (!message.author.bot) {
                // Add latency as audit logs aren't instantly updated, adding a higher latency will result in slower logs, but higher accuracy.
                await Discord.Util.delayFor(900);

                // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
                const fetchedLogs = await message.guild.fetchAuditLogs({
                    user: message.author,
                    limit: 6,
                    type: 72
                }).catch(() => ({
                    entries: []
                }));

                const auditEntry = fetchedLogs.entries.find(a =>
                    // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
                    a.target.id === message.id &&
                    a.extra.channel.id === message.channel.id &&
                    // Ignore entries that are older than 20 seconds to reduce false positives.
                    Date.now() - a.createdTimestamp < 20000
                );
                let executor = '';

                // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'.
                executor = auditEntry ? auditEntry.executor : 'Unknown, most likely deleted by bot.';

                // Message deleted embed
                const messageDelete = new Discord.MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('Message Deleted!')
                    .addField('Message by:', `${message.author}`)
                    .addField('Message content:', `${message.content}`)
                    .addField('Message deleted by:', `${executor}`)
                    .addField('Channel name:', `${message.channel.name} (<#${message.channel.id}>)`)
                    .setTimestamp()
                    .setFooter('Time message deleted  ', client.user.displayAvatarURL());
                if (executor !== 'Unknown, most likely deleted by bot.') {
                    messageDelete.addField('Message deleted by user ID:', `${executor.id}`);
                } else {
                    messageDelete.addField('Message deleted by user ID:', 'Unknown');
                }
                await client.channels.cache.get(config.logging.messageLoggingChannel).send({ embeds: [messageDelete] });
            }
        }
    });

    // Message update log
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (oldMessage.channel.type === 'dm') return;
        if (newMessage.partial || oldMessage.partial) {
            await newMessage.fetch().then((msg) => {
                console.log(msg);
            });
        }
        if (!newMessage.guild) return;
        // Message updated embed
        if (!newMessage.member.user.bot || !oldMessage.author.bot) {
            const messageEdit = new Discord.MessageEmbed()
                .setColor('FFFF00')
                .setTitle('Message edited!')
                .addField('Message edited by:', `${newMessage.author}`)
                .addField('Message content before:', `${oldMessage.content}`)
                .addField('Message content now:', `${newMessage.content}`)
                .addField('Message ID:', `${newMessage.id}`)
                .addField('Channel name:', `${oldMessage.channel.name} (<#${oldMessage.channel.id}>)`)
                .setTimestamp()
                .setFooter('Time message edited  ', client.user.displayAvatarURL());
            await client.channels.cache.get(config.logging.messageLoggingChannel).send({ embeds: [messageEdit] });
        }
    });

    // Channel create log
    client.on('channelCreate', async (channel) => {
        if (channel.type === 'dm') return;
        const mutedRoleConf = config.commandConfig.muteMember.muteRoleName;
        const channel1 = client.channels.cache.find(c => {
            return c.id === channel.id;
        });
        const muterole = channel1.guild.roles.cache.find(role => {
            return role.name === mutedRoleConf;
        });

        try {
            await channel.createOverwrite(muterole, {
                SEND_MESSAGES: false,
                MANAGE_MESSAGES: false,
                ADD_REACTIONS: false
            });
        } catch (err) {
            console.error(err);
        }
        // Channel create embed
        const channelCreate = new Discord.MessageEmbed()
            .setColor('00FF00')
            .setTitle('Channel created!')
            .addField('Channel created by:', `${channel.author}`)
            .addField('Channel name:', `${channel.name} (<#${channel.id}>)`)
            .addField('Channel ID:', `${channel.id}`)
            .setTimestamp()
            .setFooter('Time channel created  ', client.user.displayAvatarURL());
        await client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [channelCreate] });
    });

    // Channel deleted log
    client.on('channelDelete', async (channel) => {
        if (channel.type === 'dm') return;
        // Add latency as audit logs aren't instantly updated, adding a higher latency will result in slower logs, but higher accuracy.
        await Discord.Util.delayFor(900);

        // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 6,
            type: 11
        }).catch(() => ({
            entries: []
        }));

        const auditEntry = fetchedLogs.entries.find(a =>
            a.target.id === channel.id &&
            // Ignore entries that are older than 20 seconds to reduce false positives.
            Date.now() - a.createdTimestamp < 20000
        );
        let executor = '';
        // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'.
        if (auditEntry) {
            executor = auditEntry ? auditEntry.executor : 'Unknown';
        } else {
            return;
        }
        // Channel deleted embed
        const channelCreate = new Discord.MessageEmbed()
            .setColor('00FF00')
            .setTitle('Channel deleted!')
            .addField('Channel deleted by:', `${executor}`)
            .addField('Channel deleted by ID:', `${executor.id}`)
            .addField('Channel name:', `${channel.name} (<#${channel.id}>)`)
            .addField('Channel ID:', `${channel.id}`)
            .setTimestamp()
            .setFooter('Time channel deleted  ', client.user.displayAvatarURL());
        await client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [channelCreate] });
    });

    // Channel create log
    client.on('guildBanAdd', async (guild, user) => {
        // Add latency as audit logs aren't instantly updated, adding a higher latency will result in slower logs, but higher accuracy.
        await Discord.Util.delayFor(900);

        // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 6,
            type: 22
        }).catch(() => ({
            entries: []
        }));

        const auditEntry = fetchedLogs.entries.find(a =>
            a.target.id === user.id &&
            // Ignore entries that are older than 20 seconds to reduce false positives.
            Date.now() - a.createdTimestamp < 20000
        );

        let executor = '';
        console.log('Yeess');
        // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'.
        if (auditEntry) {
            executor = auditEntry ? auditEntry.executor : 'Unknown';
        } else {
            return;
        }
        // Channel create embed
        const banCreate = new Discord.MessageEmbed()
            .setColor('FF0000')
            .setTitle('Member banned!')
            .addField('Reason:', `\`\`\`${auditEntry.reason ? auditEntry.reason : 'Reason not specified'}\`\`\``)
            .addField('Banned by:', `${executor}`)
            .addField('Banned by ID:', `${executor.id}`)
            .addField('Banned member:', `${user}`)
            .addField('Banned member ID:', `${user.id}`)
            .setTimestamp()
            .setFooter('Time ban made ', client.user.displayAvatarURL());
        console.log('mhmm');
        await client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [banCreate] });
    });

    client.on('guildBanRemove', async (guild, user) => {
        // Add latency as audit logs aren't instantly updated, adding a higher latency will result in slower logs, but higher accuracy.
        await Discord.Util.delayFor(900);

        // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 6,
            type: 23
        }).catch(() => ({
            entries: []
        }));

        const auditEntry = fetchedLogs.entries.find(a =>
            a.target.id === user.id &&
            // Ignore entries that are older than 20 seconds to reduce false positives.
            Date.now() - a.createdTimestamp < 20000
        );

        let executor = '';
        // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'.
        if (auditEntry) {
            executor = auditEntry ? auditEntry.executor : 'Unknown';
        } else {
            return;
        }
        // Channel remove embed
        const banRemove = new Discord.MessageEmbed()
            .setColor('FF0000')
            .setTitle('Member unbanned!')
            .addField('Unbanned by:', `${executor}`)
            .addField('Unbanned by ID:', `${executor.id}`)
            .addField('Unbanned member:', `${user}`)
            .addField('Unbanned member ID:', `${user.id}`)
            .setTimestamp()
            .setFooter('Time unban made ', client.user.displayAvatarURL());
        await client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [banRemove] });
    });

/*     // Invite tracking.
    // Create a new map containing the invites.
    const guildInvites = new Map();
    // WHen invite created add it to the map.
    client.on('inviteCreate', async invite => guildInvites.set(invite.guild.id, await invite.guild.fetchInvites()));
    client.on('ready', () => {

        client.guilds.cache.forEach(guild => {
            guild.fetchInvites()
                .then(invites => guildInvites.set(guild.id, invites))
                .catch(err => console.log(err));
        });
    });

    client.on('guildMemberAdd', async (member) => {
        // Get the invites map.
        const cachedInvites = guildInvites.get(member.guild.id);
        // Get all the invites.
        const newInvites = await member.guild.fetchInvites();
        guildInvites.set(member.guild.id, newInvites);
        try {
            // Find the used invite.
            const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code).uses < inv.uses);

            const logMemberAdd = new Discord.MessageEmbed()
                .setColor('00FF00')
                .setTitle(`${member.user.username} Has Joined The Server!`)
                .addField('Member Tag: ', `${member.user.tag}`)
                .addField('Member ID: ', `${member.id}`)
                .addField('Member Created At:', member.createdAt)
                .addField('Invited By:', `${usedInvite.inviter.tag}\n(${usedInvite.inviter.id})`)
                .addField('Invite Link:', `https://discord.gg/${usedInvite.code}`)
                .addField('Invite Link Used:', `${usedInvite.uses} times`)
                .setTimestamp()
                .setFooter('Time User Joined ', client.user.displayAvatarURL());
            await client.channels.cache.get(config.logging.loggingChannel).send({embeds: [ logMemberAdd);
        }
        catch(err) {
            console.log(err);
        }
    });
 */
};
module.exports.config = {
    displayName: 'Logging',
    dbName: 'TEST',
    // Wait for the database connection to be present
    loadDBFirst: true
};
