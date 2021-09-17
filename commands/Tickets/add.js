const { MessageEmbed } = require('discord.js');
const tiecketSchema = require('../../schemas/ticket-schema');
const config = require('../../config/cfg');
const getType = async(isBot, dataBase) => {
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
}

const isAllowed = async(member, type) => {
    for (const roleID in type.allowedRoles) {
        if(member.roles.cache.find(role => role.id === type.allowedRoles[roleID])){
            return true;
        }
    }
    return false;
}

module.exports = {
    name: 'add',
    category: 'Tickets',
    slash: true,
    hidden: true,
    description: 'Add a person to a ticket.',
    testOnly: true,
    options: [
        {
            name: "Person",
            description: "Person to add.",
            type: "USER",
            required: true,
        },
    ],
    // Hello <@>, your ${department} has been denied. \n Reason: ${reason}. \n Supervisor who reviewed your application: ${interaction.member} \n If you have any questions please let us know.
    callback: async ({ interaction, args }) => {
        if(interaction) {
            await interaction.reply({content: 'Loading...', ephemeral: true})
            const [ argMember ] = args
            const member = interaction.guild.members.cache.find(member => member.id === argMember)
            console.log(member)
            if(!member) {
                await interaction.editReply({content: 'You did not specify a member to add, make sure you did the command properly!', ephemeral: true})
                return;
            }
            const channelDB = await tiecketSchema.findOne({ channelID: interaction.channel.id });
            if(!channelDB) {
                await interaction.editReply({content: 'SOMETHING WENT WRONG! This ticket cannot be found in our database!', ephemeral: true})
                return;
            }
            const type = await getType(interaction.user.bot, channelDB)
            if(!type) {
                await interaction.editReply({content: 'SOMETHING WENT WRONG! Doesn\'t seem like this was sent in an ticket channel.', ephemeral: true})
                return;
            }
            if(!isAllowed(interaction.member, type)) {
                await interaction.editReply({content: 'You do not have the required roles!', ephemeral: true})
                return;
            }
            await interaction.channel.permissionOverwrites.edit(member, {'VIEW_CHANNEL': true, 'SEND_MESSAGES': true, 'READ_MESSAGE_HISTORY': true, 'MENTION_EVERYONE': false})
            let channelsend = new MessageEmbed()
                .setColor('#e64b0e')
                .setTitle(`Added User`)
                .setDescription(`${interaction.member} Has Added ${member} To This Ticket!`)
            await interaction.channel.send({ embeds: [channelsend] })
            await interaction.editReply({content: 'Member added.', ephemeral: true})
        }
    },
},

module.exports.config = {
    displayName: 'Add a person to a ticket.',
    dbName: 'ADD',
    loadDBFirst: true,
};