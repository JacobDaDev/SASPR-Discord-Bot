// Ticket schema, database info
const ticketDB = require('../schemas/tickets.json');
const msgDB = require('../schemas/messages.json');

// Get the config so we can get the correct muted role
const config = require('../config/cfg');

// Embeds again
const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = async (client) => {
    const getMessageID = async (_type, channelID) => {
        let messageID;
        const DBMatches = msgDB[_type];
        const channel = client.channels.cache.get(channelID);
        if (DBMatches.length > 0) {
            if (DBMatches.length > 1) {
                for (const index in DBMatches) {
                    const msgID = DBMatches[index].messageId;
                    try {
                        await channel.messages.fetch(msgID);
                        messageID = msgID;
                    } catch (err) {
                        delete msgDB[_type][index]
                    }
                }
            } else {
                messageID = DBMatches[0].messageId;
                try {
                    await channel.messages.fetch(messageID);
                } catch (err) {
                    delete msgDB[_type]
                }
            }
        }
        return { messageID, channel };
    };
    for (const type in config.tickets.differentTypes) {
        const channelID = config.tickets.differentTypes[type].createTicketChannel;
        const { messageID, channel } = await getMessageID(type, channelID);
        if (messageID !== undefined) {
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
                        msgDB[type] = {
                            messageId = message.id
                        }
                        fs.writeFile('../schemas/messages.json', JSON.stringify(msgDB), (err) => {
                            if (err) console.error(err);
                        });
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
                    msgDB[type] = {
                        messageId = message.id
                    }
                    fs.writeFile('../schemas/messages.json', JSON.stringify(msgDB), (err) => {
                        if (err) console.error(err);
                    });
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
    for (const type in config.applications.differentTypes) {
        const channelId = config.applications.differentTypes[type].createTicketChannel
        const sendChannel = guild.channels.cache.find(r => r.id === channelId);
        const messageID = await msgDB[type].messageId;
        await sendChannel.messages.fetch(messageID).catch(async () => {
            // NOT FOUND
            const embed = new MessageEmbed()
                .setColor(config.applications.differentTypes[type].embed.color)
                .setTitle(config.applications.differentTypes[type].embed.title)
                .setDescription(config.applications.differentTypes[type].description)
                .setImage(config.applications.differentTypes[type].embed.image)
                .setFields(config.applications.differentTypes[type].embed.fields)
                .setTimestamp()
                .setFooter(config.applications.differentTypes[type].embed.title, client.user.displayAvatarURL())
    
            const buttonButton = await new MessageButton()
                .setStyle('PRIMARY')
                .setLabel(`Create An Application!`)
                .setEmoji(config.applications.differentTypes[type].Emoji, false)
                .setCustomId(type);
            const button = await new MessageActionRow()
                .addComponents(buttonButton);
    
            await sendChannel.send({ embeds: [embed], components: [button]}).then(async (message) => {
                msgDB[type] = {
                    messageId = message.id
                }
                fs.writeFile('../schemas/tickets.json', JSON.stringify(msgDB), (err) => {
                    if (err) console.error(err);
                });
            })
        })
    }

    const checkTickets = async () => {
        // Current date
        const now = new Date();
        
        const results = [];
        // Get info wether or not the ticket is expired
        for (let member in ticketDB) {
            for (let channelID in ticketDB[member]) {
                if (ticketDB[member][channelID].expires == now && !ticketDB[member][channelID].current && !keep) {
                    results.push(ticketDB[member][channelID]);
                    delete ticketDB[member][channelID];
                    fs.writeFile('../schemas/tickets.json', JSON.stringify(ticketDB), (err) => {
                        if (err) console.error(err);
                    });
                }
            }
        }
        console.log(results)
        // If returns true (ticket should be deleted)
        if (results) {
            for (let result in results) {
                console.log(result)
                const guild = client.guilds.cache.get(result.guildId);
                const channel = guild.channels.cache.find(r => r.id === result);
                if (channel) {
                    channel.delete('Ticket Closed');
                }
            }
        }
    };
    // Make it run every 5 minutes
    setTimeout(checkTickets, 1000 * 60 * 5);
    client.on('ready', async () => {
        // Check the mutes when client is ready
        checkTickets();
    });
};