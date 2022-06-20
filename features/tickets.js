// Embeds again
const { MessageEmbed, MessageButton, MessageActionRow, MessageAttachment } = require('discord.js');

// HTML Transcript.
const { generateTranscript } = require('reconlx');

// Incase of an error we need to get the error channel
const config = require('../config/cfg');

const ticketDB = require('../schemas/tickets.json');

const amountOfTypes = async (member, type) => {
    let tooMuchOfType = false;
    let typeChannelID;
    if (ticketDB[memberID]) {
        for (let channelID in ticketDB[member]) {
            if (ticketDB[member][channelID].type == type && ticketDB[member][channelID].current) {
                tooMuchOfType = true;
                typeChannelID = channelID;
                break;
            }
        }
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

const openButtonButton = new MessageButton()
    .setStyle('SUCCESS')
    .setLabel('To Open The Ticket Again Press Me.')
    .setEmoji('📌', false)
    .setCustomId('open!ticket');

const keepButtonDisabledButton = new MessageButton()
    .setStyle('SUCCESS')
    .setLabel('To Keep The Ticket Press Me.')
    .setEmoji('📌', false)
    .setCustomId('keep!ticket')
    .setDisabled(true);

const openButtonDisabledButton = new MessageButton()
    .setStyle('SUCCESS')
    .setLabel('To Open The Ticket Again Press Me.')
    .setEmoji('📌', false)
    .setCustomId('open!ticket')
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
const deleteButton = new MessageActionRow()
    .addComponents(deleteButtonButton);
const closeButton = new MessageActionRow()
    .addComponents(closeButtonButton);
const ticketKeepDeleteRow = new MessageActionRow()
    .addComponents(deleteButtonButton, openButtonButton, keepButtonButton);
const ticketKeepDeleteRowDisabled = new MessageActionRow()
    .addComponents(deleteButtonDisabledButton, openButtonDisabledButton, keepButtonDisabledButton);

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
    const openTicket = new MessageEmbed()
        .setColor('FF0000')
        .setAuthor('Updating this ticket to open again, this should only take a few milliseconds!')
        .setTimestamp();
    const ticketOpened = new MessageEmbed()
        .setColor('FF0000')
        .setAuthor('Ticket is open again!')
        .setTimestamp();
    const loading = new MessageEmbed()
        .setColor('FF0000')
        .setAuthor('Loading...')
        .setTimestamp();

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
        await interaction.reply({ embeds: [loading], ephemeral: true });
        const type = await getType(interaction);
        if (type) {
            await interaction.editReply({ embeds: [loadingTicket], ephemeral: true });
            const { tooMuchOfType, typeChannelID } = await amountOfTypes(interaction.user.id, interaction.customId);
            if (tooMuchOfType) {
                const typeAlreadyExists = new MessageEmbed()
                    .setColor('FF0000')
                    .setAuthor('Ticket Already Exists!')
                    .setDescription(`${interaction.member}, Your Already Have A ${type.name} Ticket Open At <#${typeChannelID}>.`)
                    .setTimestamp();
                await interaction.editReply({ embeds: [typeAlreadyExists], ephemeral: true });
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
                        id: interaction.user.id
                    },
                    {
                        deny: 'VIEW_CHANNEL',
                        id: guild.id
                    }
                ],
                reason: `Ticket Created By ${interaction.member}`
            }).then(async (channel) => {
                await ticketCreated.setDescription(`${interaction.member}, Your ${type.name} Ticket Is Open At ${channel}.`);
                await interaction.editReply({ embeds: [ticketCreated], ephemeral: true });

                for (const roleID in type.allowedRoles) {
                    const role = await interaction.guild.roles.cache.find(role => role.id === type.allowedRoles[roleID]);
                    if (role) {
                        await channel.permissionOverwrites.edit(role, {
                            VIEW_CHANNEL: true
                        });
                    }
                    const message1 = await channel.send('<@' + role + '>');
                    message1.delete();
                }
                for (const memberID in type.allowedPeople) {
                    const member = interaction.guild.members.cache.get(type.allowedPeople[memberID]);
                    if (member) {
                        await channel.permissionOverwrites.edit(member, {
                            VIEW_CHANNEL: true
                        });
                    }
                    const message2 = await channel.send('<@' + member + '>');
                    message2.delete();
                }
                ticketDB[interaction.user.id][channel.id] = {
                    type = interaction.customId,
                    guildId = interaction.guild.id,
                    current = true,
                    keep = false,
                    allowedMembers = channel.members
                }
                fs.writeFile('../schemas/tickets.json', JSON.stringify(ticketDB), (err) => {
                    if (err) console.error(err);
                });
                const date = new Date();
                const ticketEmbed = await new MessageEmbed()
                    .setColor('#297fd6')
                    .setTitle(type.name + ' Ticket')
                    .setDescription(`${interaction.member}, thank you for opening a ticket. Our support team will be with you as soon as they can.`)
                    .addField('Time Application Opened:', date.toLocaleString())
                    .setFooter(`${type.name} - These messages will be logged.`)
                    .setTimestamp();
                channel.send({ embeds: [ticketEmbed], components: [closeButton] });
                const message3 = await channel.send({ content: `Ticktet created ${interaction.member}` });
                message3.delete();
            }).catch(err => {
                if (err.message.includes('Maximum number of channels in category reached (50)')) {
                    interaction.channel.send('Please contact someone from the support team. There are too many channels in the Ticket category!');
                }
            });
        } else if (interaction.customId === 'lock!ticket' && interaction.channel.name.includes('ticket')) {
            let channelDB = ticketDB[memberID][interaction.channel.id];

            if (channelDB) {
                await interaction.editReply({ embeds: [closingTicket], ephemeral: true });
                const getSameEmbed = interaction.message.embeds[0];
                await interaction.message.edit({ embeds: [getSameEmbed], components: [closeButtonDisabled] });
                const closedAt = new Date();
                const embed = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle(`${interaction.user.username} has closed this ticket.`)
                    .setDescription('Ticket will be deleted in 24 hours from this message being sent.\nIf you wish to keep this ticket open click the 📌 button below.\nYou can also delete the ticket now by clicking the 🔐 button below.');
                interaction.message.channel.send({ embeds: [embed], components: [ticketKeepDeleteRow] });
                const ts = closedAt.getTime();
                const toClose = ts + (1000 * 60 * 60 * 24);
                ticketDB[memberID][interaction.channel.id] = {
                    expires = toClose,
                    keep = false,
                    current = false
                }
                fs.writeFile('../schemas/tickets.json', JSON.stringify(ticketDB), (err) => {
                    if (err) console.error(err);
                });
                await interaction.channel.lockPermissions();
            }
        } else if (interaction.customId === 'delete!ticket' && interaction.channel.name.includes('ticket')) {
            await interaction.editReply({ embeds: [deletingTicket], ephemeral: true });
            const results = ticketDB[member][interaction.channel.id].current;
            if (results === false) {
                await interaction.channel.messages.fetch({ limit: 100 }).then(async (messages) => {
                    // Iterate through the messages here with the variable "messages".
                    const guild = { name: interaction.guild.name, iconURL: function () { return interaction.guild.icon; } };
                    const channel = { name: interaction.channel.name };
                    const date = new Date();
                    const logDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('Ticket Deleted!')
                        .addField('Channel:', interaction.channel.name)
                        .addField('Deleted by:', `<@${interaction.member.id}>`)
                        .addField('Ticket Deleted At:', date.toLocaleString())
                        .setTimestamp()
                        .setFooter('Time message deleted  ', client.user.displayAvatarURL());
                    await generateTranscript(guild, channel, messages).then(async (url) => {
                        const file = await new MessageAttachment(url, 'messageLog.html');
                        await client.channels.cache.get(config.logging.loggingChannel).send({ embeds: [logDelete], files: [file] }).catch(console.error());
                    });
                });
                delete ticketDB[member][interaction.channel.id];
                fs.writeFile('../schemas/tickets.json', JSON.stringify(ticketDB), (err) => {
                    if (err) console.error(err);
                });
                channel.delete('Ticket Closed');
            }
        } else if (interaction.customId === 'keep!ticket' && interaction.channel.name.includes('ticket')) {
            await interaction.editReply({ embeds: [keepingTicket], ephemeral: true });
            const getSameEmbed = interaction.message.embeds[0];
            await interaction.message.edit({ embeds: [getSameEmbed], components: [ticketKeepDeleteRowDisabled] });
            const results = ticketDB[member][interaction.channel.id].current;
            if (results === false) {
                ticketDB[member][interaction.channel.id].keep = true;
                fs.writeFile('../schemas/tickets.json', JSON.stringify(ticketDB), (err) => {
                    if (err) console.error(err);
                });
                await interaction.editReply({ embeds: [ticketWillBeKept], ephemeral: true });
                await ticketWillBeKept.setDescription(`This ticket will be kept (only staff can see the channel) as requested by ${interaction.member}.\nTo delete this ticket press the 🔐 button below.`);
                await interaction.channel.send({ embeds: [ticketWillBeKept], components: [deleteButton] });
            }
        } else if (interaction.customId === 'open!ticket' && interaction.channel.name.includes('ticket')) {
            await interaction.editReply({ embeds: [openTicket], ephemeral: true });
            const getSameEmbed = interaction.message.embeds[0];
            await interaction.message.edit({ embeds: [getSameEmbed], components: [ticketKeepDeleteRowDisabled] });
            const results = ticketDB[member][interaction.channel.id].current;
            if (results === false) {
                ticketDB[member][interaction.channel.id].keep = true;
                ticketDB[member][interaction.channel.id].current = true;
                fs.writeFile('../schemas/tickets.json', JSON.stringify(ticketDB), (err) => {
                    if (err) console.error(err);
                });
                for (let member in ticketDB[member][interaction.channel.id].allowedMembers) {
                    await channel.permissionOverwrites.edit(member, {
                        VIEW_CHANNEL: true,
                        VIEW_MESSAGE_HISTORY: true
                    });
                }
                await interaction.editReply({ embeds: [ticketOpened], ephemeral: true });
                await ticketOpened.setDescription(`This ticket has been opened as requested by ${interaction.member}.\nTo close this ticket press the 🔒 button below.`);
                await interaction.channel.send({ embeds: [ticketOpened], components: [closeButton] });
            }
        }
    });
};

module.exports.config = {
    displayName: 'Ticket',
};
