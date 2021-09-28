// Ticket schema, database info
const tiecketSchema = require('../schemas/ticket-schema');
const TiecketMsgSchema = require('../schemas/ticket-message-schema');

// Get the config so we can get the correct muted role
const config = require('../config/cfg');

// Embeds again
const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = async (client) => {
    const getMessageID = async (_type, channelID) => {
        let messageID;
        const DBMatches = (await TiecketMsgSchema.find({ ticketType: _type }));
        console.log(DBMatches.length);
        const channel = client.channels.cache.get(channelID);
        if (DBMatches.length > 0) {
            if (DBMatches.length > 1) {
                for (const index in DBMatches) {
                    const msgID = DBMatches[index].msgID;
                    try {
                        await channel.messages.fetch(msgID);
                        messageID = msgID;
                    } catch (err) {
                        TiecketMsgSchema.findOneAndDelete({ ticketType: _type, msgID: msgID }, async (_err, data) => {
                            if (data) console.log('Deleted an old ticket message.');
                        });
                    }
                }
            } else {
                messageID = DBMatches[0].msgID;
            }
        }
        return { messageID, channel };
    };
    for (const type in config.tickets.differentTypes) {
        const channelID = config.tickets.differentTypes[type].createTicketChannel;
        const { messageID, channel } = await getMessageID(type, channelID);
        if (messageID !== undefined) {
            console.log(messageID);
            channel.messages.fetch(messageID).catch(async () => {
                const ticketEmbed = new MessageEmbed()
                    .setColor('#297fd6')
                    .setTitle(`Create A ${config.tickets.differentTypes[type].name} Ticket`)
                    .setDescription(config.tickets.differentTypes[type].TicketText)
                    .setFooter('All Of The Messages Sent In A Ticket Will Be Logged.', client.user.displayAvatarURL());
                const buttonButton = await new MessageButton()
                    .setStyle('PRIMARY')
                    .setLabel(`Create A ${config.tickets.differentTypes[type].name} Ticket!`)
                    .setEmoji(config.tickets.differentTypes[type].Emoji, false)
                    .setCustomId(type);
                const button = await new MessageActionRow()
                    .addComponents(buttonButton);
                channel.send({ embeds: [ticketEmbed], components: [button] }).then((message) => {
                    try {
                        new TiecketMsgSchema({
                            ticketType: type,
                            msgID: message.id
                        }).save();
                    } catch (err) {
                        console.error('Erro while adding the ticket to database: ' + err);
                        const messageDelete = new MessageEmbed()
                            .setColor('FF0000')
                            .setTitle('ERROR!')
                            .addField('Error while adding the ticket to database:', `${err}`)
                            .setTimestamp()
                            .setFooter('Time error occured  ', client.user.displayAvatarURL());
                        client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                    }
                });
            });
        } else {
            console.log(messageID);
            const ticketEmbed = new MessageEmbed()
                .setColor('#297fd6')
                .setTitle(`Create A ${config.tickets.differentTypes[type].name} Ticket`)
                .setDescription(config.tickets.differentTypes[type].TicketText)
                .setFooter('All Of The Messages Sent In A Ticket Will Be Logged.', client.user.displayAvatarURL());
            const buttonButton = new MessageButton()
                .setStyle('PRIMARY')
                .setLabel(`Create A ${config.tickets.differentTypes[type].name} Ticket!`)
                .setEmoji(config.tickets.differentTypes[type].Emoji, false)
                .setCustomId(type);
            const button = new MessageActionRow()
                .addComponents(buttonButton);

            channel.send({ embeds: [ticketEmbed], components: [button] }).then((message) => {
                try {
                    new TiecketMsgSchema({
                        ticketType: type,
                        msgID: message.id
                    }).save();
                } catch (err) {
                    console.error('Erro while adding the ticket to database: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while adding the ticket to database:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                }
            });
        }
    }
    const button = await new MessageActionRow();
    const buttons = [];
    for (const type in config.applications.differentTypes) {
        const buttonButton = await new MessageButton()
            .setStyle('PRIMARY')
            .setLabel(`Create A ${config.applications.differentTypes[type].name}!`)
            .setEmoji(config.applications.differentTypes[type].Emoji, false)
            .setCustomId(type);
        buttons.push(buttonButton);
    }
    button.addComponents(buttons);

    const channelID = config.applications.createTicketChannel;
    const { messageID, channel } = await getMessageID('applications', channelID);
    if (messageID !== undefined) {
        console.log(messageID);
        channel.messages.fetch(messageID).catch(async () => {
            const ticketEmbed = new MessageEmbed()
                .setColor('#297fd6')
                .setTitle('Department Applications')
                .setDescription('Create an Application By Clicking the Correct Button Below!')
                .setFooter('All Of The Messages Sent In A Ticket Will Be Logged.', client.user.displayAvatarURL());
            channel.send({ embeds: [ticketEmbed], components: [button] }).then((message) => {
                try {
                    new TiecketMsgSchema({
                        ticketType: 'applications',
                        msgID: message.id
                    }).save();
                } catch (err) {
                    console.error('Erro while adding the ticket to database: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while adding the ticket to database:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                }
            });
        });
    } else {
        console.log(messageID);
        const ticketEmbed = new MessageEmbed()
            .setColor('#297fd6')
            .setTitle('Department Applications')
            .setDescription('Create an Application By Clicking the Correct Button Below!')
            .setFooter('All Of The Messages Sent In A Ticket Will Be Logged.', client.user.displayAvatarURL());
        channel.send({ embeds: [ticketEmbed], components: [button] }).then((message) => {
            try {
                new TiecketMsgSchema({
                    ticketType: 'applications',
                    msgID: message.id
                }).save();
            } catch (err) {
                console.error('Erro while adding the ticket to database: ' + err);
                const messageDelete = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('ERROR!')
                    .addField('Error while adding the ticket to database:', `${err}`)
                    .setTimestamp()
                    .setFooter('Time error occured  ', client.user.displayAvatarURL());
                client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
            }
        });
    }

    const checkTickets = async () => {
        // Current date
        const now = new Date();
        // Get info wether or not the ticket is expired
        const conditional = {
            expires: {
                $lt: now
            },
            current: false,
            keep: false
        };
        // Gives the info intself from the constant above
        const results = await tiecketSchema.findOne(conditional);
        // If returns true (ticket should be deleted)
        console.log(results);
        if (results) {
            const guild = client.guilds.cache.get(results.guildId);
            const channel = guild.channels.cache.find(r => r.id === results.channelID);
            if (channel) {
                channel.delete('Ticket Closed');
            }
            await tiecketSchema.findOneAndDelete(conditional, async (_err, data) => {
                if (data) console.log('Deleted an old ticket channel.');
            });
        }
    };
    // Make it run every 5 minutes
    setTimeout(checkTickets, 1000 * 60 * 5);
    checkTickets();
    client.on('ready', async () => {
        // Check the mutes when client is ready
        checkTickets();
    });
};
module.exports.config = {
    loadDBFirst: true
};
