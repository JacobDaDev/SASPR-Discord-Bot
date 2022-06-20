/* eslint-disable no-unused-expressions */
const { MessageEmbed } = require('discord.js');
const ticketDB = require('../../schemas/tickets.json');
const config = require('../../config/cfg');
const getType = async (isBot, dataBase) => {
    for (const _type in config.tickets.differentTypes) {
        const type = config.tickets.differentTypes[_type];
        if (!isBot && dataBase.type === _type) {
            return type;
        }
    }
    for (const _type in config.applications.differentTypes) {
        const type = config.applications.differentTypes[_type];
        if (!isBot && dataBase.type === _type) {
            return type;
        }
    }
    return false;
};

const isAllowed = async (member, type) => {
    for (const roleID in type.allowedRoles) {
        if (member.roles.cache.find(role => role.id === type.allowedRoles[roleID])) {
            return true;
        }
    }
    return false;
};

module.exports = {
    name: 'remove',
    category: 'Tickets',
    slash: true,
    hidden: true,
    description: 'Remove a person from a ticket.',
    testOnly: true,
    options: [
        {
            name: 'Person',
            description: 'Person to remove.',
            type: 'USER',
            required: true
        }
    ],
    // Hello <@>, your ${department} has been denied. \n Reason: ${reason}. \n Supervisor who reviewed your application: ${interaction.member} \n If you have any questions please let us know.
    callback: async ({ interaction, args }) => {
        if (interaction) {
            await interaction.reply({ content: 'Loading...', ephemeral: true });
            const [argMember] = args;
            const member = interaction.guild.members.cache.find(member => member.id === argMember);
            console.log(member);
            if (!member) {
                await interaction.editReply({ content: 'You did not specify a member to add, make sure you did the command properly!', ephemeral: true });
                return;
            }
            const channelDB = ticketDB[member][interaction.channel.id];
            if (!channelDB) {
                await interaction.editReply({ content: 'SOMETHING WENT WRONG! This ticket cannot be found in our database!', ephemeral: true });
                return;
            }
            const type = await getType(interaction.user.bot, channelDB);
            if (!type) {
                await interaction.editReply({ content: 'SOMETHING WENT WRONG! Doesn\'t seem like this was sent in an ticket channel.', ephemeral: true });
                return;
            }
            if (!isAllowed(interaction.member, type)) {
                await interaction.editReply({ content: 'You do not have the required roles!', ephemeral: true });
                return;
            }
            await interaction.channel.permissionOverwrites.edit(member, { VIEW_CHANNEL: false });
            const channelsend = new MessageEmbed()
                .setColor('#e64b0e')
                .setTitle('Removed User')
                .setDescription(`${interaction.member} Has Removed ${member} From This Ticket!`);
            ticketDB[member][interaction.channel.id].allowedMembers = channel.members;
            fs.writeFile('../schemas/tickets.json', JSON.stringify(ticketDB), (err) => {
                if (err) console.error(err);
            });
            await interaction.channel.send({ embeds: [channelsend] });
            await interaction.editReply({ content: 'Member removed.', ephemeral: true });
        }
    }
};

module.exports.config = {
    displayName: 'Remove a person from a ticket.',
    dbName: 'REMOVE',
    loadDBFirst: true
};
