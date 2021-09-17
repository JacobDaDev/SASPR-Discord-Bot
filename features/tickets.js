// Embeds again
const { MessageEmbed, MessageButton, MessageActionRow, MessageAttachment } = require('discord.js');

// HTML Transcript.
const { generateTranscript } = require('reconlx');
const axios = require('axios');

// Incase of an error we need to get the error channel
const config = require('../config/cfg');

const tiecketSchema = require('../schemas/ticket-schema');

const amountOfTypes = async (member, type) => {
    console.log(member);
    console.log(type);
    const types = await tiecketSchema.find({
        userId: member,
        type: type,
        current: true,
    });
    let tooMuchOfType = false;
    let typeChannelID = undefined;
    if(types.length > 0) {
        tooMuchOfType = true;
        typeChannelID = await types[0].channelID;
    }
    return { tooMuchOfType, typeChannelID };
};

const getType = async (button) => {
    for (const _type in config.tickets.differentTypes) {
        const type = config.tickets.differentTypes[_type];
        if (_type === button.customId && type.createTicketChannel === button.channelId && !button.user.bot) {
            return type;
        }
    }
    for (const _type in config.applications.differentTypes) {
        const type = config.applications.differentTypes[_type];
        if (_type === button.customId && config.applications.createTicketChannel === button.channelId && !button.user.bot) {
            return type;
        }
    }
    return false;
};

const closeButtonButton = new MessageButton()
    .setStyle('PRIMARY')
    .setLabel('To Close The Ticket Press Me.')
    .setEmoji('🔒', false)
    .setCustomId('lock!ticket');

const deleteButtonButton = new MessageButton()
    .setStyle('DANGER')
    .setLabel('To Close The Ticket Press Me.')
    .setEmoji('🔐', false)
    .setCustomId('delete!ticket');

const keepButtonButton = new MessageButton()
    .setStyle('SUCCESS')
    .setLabel('To Keep The Ticket Press Me.')
    .setEmoji('📌', false)
    .setCustomId('keep!ticket');

const keepButtonDisabledButton = new MessageButton()
    .setStyle('SUCCESS')
    .setLabel('To Keep The Ticket Press Me.')
    .setEmoji('📌', false)
    .setCustomId('keep!ticket')
    .setDisabled(true);

const deleteButtonDisabledButton = new MessageButton()
    .setStyle('DANGER')
    .setLabel('To Close The Ticket Press Me.')
    .setEmoji('🔐', false)
    .setCustomId('delete!ticket')
    .setDisabled(true);

const closeButtonDisabledButton = new MessageButton()
    .setStyle('PRIMARY')
    .setLabel('To Close The Ticket Press Me.')
    .setEmoji('🔒', false)
    .setCustomId('lock!ticket')
    .setDisabled(true);

const closeButtonDisabled = new MessageActionRow()
    .addComponents(closeButtonDisabledButton);
const deleteButtonDisabled = new MessageActionRow()
    .addComponents(deleteButtonDisabledButton);
const keepButtonDisabled = new MessageActionRow()
    .addComponents(keepButtonDisabledButton);
const keepButton = new MessageActionRow()
    .addComponents(keepButtonButton);
const deleteButton = new MessageActionRow()
    .addComponents(deleteButtonButton);
const closeButton = new MessageActionRow()
    .addComponents(closeButtonButton);
const ticketKeepDeleteRow = new MessageActionRow()
    .addComponents(deleteButtonButton, keepButtonButton);
const ticketKeepDeleteRowDisabled = new MessageActionRow()
    .addComponents(deleteButtonDisabledButton, keepButtonDisabledButton);

module.exports = async (client) => {
    const loadingTicket = new MessageEmbed()
        .setColor('FF0000')
        .setAuthor('Loading your ticket, this should only take a few milliseconds!')
        .setTimestamp();
    const closingTicket = new MessageEmbed()
        .setColor('FF0000')
        .setAuthor('Closing your ticket, this should only take a few milliseconds!')
        .setTimestamp();
    const deletingTicket = new MessageEmbed()
        .setColor('FF0000')
        .setAuthor('Deleting this ticket, this should only take a few milliseconds!')
        .setTimestamp();
    const keepingTicket = new MessageEmbed()
        .setColor('FF0000')
        .setAuthor('Updating this ticket to be kept, this should only take a few milliseconds!')
        .setTimestamp();
    const ticketWillBeKept = new MessageEmbed()
        .setColor('FF0000')
        .setAuthor('Ticket will now not be deleted!')
        .setTimestamp();
    const loading = new MessageEmbed()
        .setColor('FF0000')
        .setAuthor('Loading...')
        .setTimestamp();

    client.on('interactionCreate', async(interaction) => {
        if(!interaction.isButton()) return;
        await interaction.reply({embeds: [loading], ephemeral: true});
        const type = await getType(interaction);
        if(type) {
            await interaction.editReply({embeds: [loadingTicket], ephemeral: true});
            const { tooMuchOfType, typeChannelID } = await amountOfTypes(interaction.user.id, interaction.customId);
            if(tooMuchOfType) {
                const typeAlreadyExists = new MessageEmbed()
                    .setColor('FF0000')
                    .setAuthor('Ticket Already Exists!')
                    .setDescription(`${interaction.member}, Your Already Have A ${type.name} Ticket Open At <#${typeChannelID}>.`)
                    .setTimestamp();
                await interaction.editReply({embeds: [typeAlreadyExists], ephemeral: true});
                return;
            }
            const ticketCreated = new MessageEmbed()
                .setColor('FF0000')
                .setAuthor('Ticket Created!')
                .setFooter(`${type.name} - These messages will be logged.`)
                .setTimestamp();
            const guild = interaction.guild;
            // Create channel based on permissions. Note, you need to modify the permissionsOverwrites array to fit your needs for permissions.
            await guild.channels.create(`${interaction.user.username}s-${type.name}-ticket`, {
                type: 'text',
                topic: `${type.name} Ticket For ${interaction.member}.`,
                parent: type.createTo || config.tickets.createTicketToCategory,
                permissionOverwrites: [
                    {
                        allow: 'VIEW_CHANNEL',
                        id: interaction.user.id,
                    },
                    {
                        deny: 'VIEW_CHANNEL',
                        id: guild.id,
                    },
                ],
                reason: `Ticket Created By ${interaction.member}`,
            }).then(async (channel) => {
                await ticketCreated.setDescription(`${interaction.member}, Your ${type.name} Ticket Is Open At ${channel}.`);
                await interaction.editReply({embeds: [ticketCreated], ephemeral: true});

                for (const roleID in type.allowedRoles) {
                    const role = await interaction.guild.roles.cache.find(role => role.id === type.allowedRoles[roleID]);
                    if (role) {
                        channel.permissionOverwrites.edit(role, {
                            VIEW_CHANNEL: true,
                        });
                    }
                    const message1 = await channel.send('<@' + role + '>');
                    message1.delete();
                }
                for (const memberID in type.allowedPeople) {
                    const member = interaction.guild.members.cache.get(type.allowedPeople[memberID]);
                    if (member) {
                        channel.permissionOverwrites.edit(member, {
                            VIEW_CHANNEL: true,
                        });
                    }
                    const message2 = await channel.send('<@' + member + '>');
                    message2.delete();
                }
                try{
                    new tiecketSchema({
                        userId: interaction.user.id,
                        guildId: interaction.guild.id,
                        type: interaction.customId,
                        channelID: channel.id,
                        current: true,
                    }).save();
                }
                catch(err) {
                    console.error('Erro while adding the ticket to database: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while adding the ticket to database:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(config.logging.errorChannel).send(messageDelete);
                    return;
                }
                const date = new Date()
                console.log(type.application)
                const ticketEmbed = await new MessageEmbed()
                    .setColor('#297fd6')
                    .setTitle(type.name + ' Ticket')
                    .addField('Time Application Opened:', date.toLocaleString())
                    .setFooter(`${type.name} - These messages will be logged.`)
                    .setTimestamp();
                if(type.application) {
                    ticketEmbed.setDescription(`>>> ${interaction.member}, thank you for opening an application! \n\n **Please fill this form: ${type.application}** \n\n A member of our leadership team will review it at their earliest convenience.`)
                } else {
                    ticketEmbed.setDescription(`${interaction.member}, thank you for opening a ticket. Our support team will be with you as soon as they can.`)
                }
                channel.send({embeds: [ticketEmbed], components: [closeButton]});
                const message3 = await channel.send({content: `Ticktet created ${interaction.member}`});
                message3.delete();
            }).catch(err => {
                if (err.message.includes("Maximum number of channels in category reached (50)")) {
                    interaction.channel.send('Please contact someone from the support team. There are too many channels in the Ticket category!')
                }
            });
        }
        else if(interaction.customId === 'lock!ticket' && interaction.channel.name.includes('ticket')) {
            const channelDB = await tiecketSchema.findOne({ channelID: interaction.channel.id });
            if(channelDB) {
                await interaction.editReply({embeds: [closingTicket], ephemeral: true});
                const getSameEmbed = interaction.message.embeds[0];
                await interaction.message.edit({embeds: [getSameEmbed], components: [closeButtonDisabled]});
                const closedAt = new Date();
                if(channelDB) {
                    const embed = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle(`${interaction.user.username} has closed this ticket.`)
                        .setDescription('Ticket will be deleted in 24 hours from this message being sent.\nIf you wish to keep this ticket open click the 📌 button below.\nYou can also delete the ticket now by clicking the 🔐 button below.');
                    interaction.message.channel.send({embeds: [embed], components: [ticketKeepDeleteRow]});
                    const ts = closedAt.getTime();
                    const toClose = ts + (1000 * 60 * 60 * 24);
                    try {
                        tiecketSchema.findOneAndUpdate({ channelID: interaction.channel.id }, { expires: toClose, current: false, keep: false }, async (err, data) => {
                            if(data) {
                                interaction.channel.lockPermissions();
                            }
                        });
                    }
                    catch(e) {
                        console.error(e);
                    }
                }
            }
        }
        else if(interaction.customId === 'delete!ticket' && interaction.channel.name.includes('ticket')) {
            await interaction.editReply({embeds: [deletingTicket], ephemeral: true});
            const conditional = {
                channelID: interaction.channel.id,
                current: false,
            };
            // Gives the info intself from the constant above
            const results = await tiecketSchema.findOne(conditional);
            if (results) {
                const guild = client.guilds.cache.get(results.guildId);
                const channel = guild.channels.cache.find(r => r.id === results.channelID);
                if(channel) {
                    await interaction.channel.messages.fetch({ limit: 100 }).then(async (messages) => {
                        // Iterate through the messages here with the variable "messages".
                        const guild = {name: interaction.guild.name, iconURL: function() {return interaction.guild.icon;}}
                        const channel = {name: interaction.channel.name}
                        const date = new Date()
                        const logDelete = new MessageEmbed()
                            .setColor('FF0000')
                            .setTitle('Ticket Deleted!')
                            .addField('Channel:', interaction.channel.name)
                            .addField('Deleted by:', `<@${interaction.member.id}>`)
                            .addField('Ticket Deleted At:', date.toLocaleString())
                            .setTimestamp()
                            .setFooter('Time message deleted  ', client.user.displayAvatarURL());
                        await generateTranscript(guild, channel, messages).then(async (url) => {
                            const file = await new MessageAttachment(url, 'messageLog.html')
                            await client.channels.cache.get(config.logging.loggingChannel).send({embeds: [logDelete], files: [ file ]}).catch(console.error())
                        });
                    });
                    channel.delete('Ticket Closed');
                }
                await tiecketSchema.findOneAndDelete(conditional, async (err, data) => {
                    if(data) console.log('Deleted an old ticket channel.');
                });
            }
        }
        else if(interaction.customId === 'keep!ticket' && interaction.channel.name.includes('ticket')) {
            await interaction.editReply({embeds: [keepingTicket], ephemeral: true});
            const getSameEmbed = interaction.message.embeds[0];
            await interaction.message.edit({embeds: [getSameEmbed], components: [ticketKeepDeleteRowDisabled]});
            const conditional = {
                channelID: interaction.channel.id,
                current: false,
            };
            // Gives the info intself from the constant above
            const results = await tiecketSchema.findOne(conditional);
            // If returns true (ticket should be deleted)
            console.log(results);
            if (results) {
                try {
                    await tiecketSchema.findOneAndUpdate(conditional, { keep: true }, async (err, data) => {
                        if(data) {
                            await interaction.editReply({embeds: [ticketWillBeKept], ephemeral: true});
                            await ticketWillBeKept.setDescription(`This ticket will be kept as requested by ${interaction.member}.\nTo delete this ticket press the 🔐 button below.`);
                            await interaction.channel.send({embeds: [ticketWillBeKept], components: [deleteButton]});
                        }
                    });
                }
                catch(e) {
                    console.error(e);
                }

            }
        }
    });
};

module.exports.config = {
    displayName: 'Ticket',
    dbName: 'TEST',
    // Wait for the database connection to be present
    loadDBFirst: true,
};