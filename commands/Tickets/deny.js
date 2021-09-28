// Get the embeds
const { MessageEmbed } = require('discord.js');
const tiecketSchema = require('../../schemas/ticket-schema');
const config = require('../../config/cfg');
const getType = async (isBot, dataBase) => {
    for (const _type in config.applications.differentTypes) {
        console.log(_type);
        console.log(dataBase.type);
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
    name: 'deny',
    category: 'Applications',
    description: 'Deny a person for a department.',
    testOnly: true,
    minArgs: 1,
    hidden: true,
    slash: true,
    expectedArgs: '<Reason>',
    options: [
        {
            name: 'Reason',
            description: 'Reason for denial.',
            type: 'STRING',
            required: true
        }
    ],
    // Hello <@>, your ${department} has been denied. \n Reason: ${reason}. \n Supervisor who reviewed your application: ${interaction.member} \n If you have any questions please let us know.
    callback: async ({ interaction, args }) => {
        if (interaction) {
            await interaction.reply({ content: 'Loading...', ephemeral: true });
            const [reason] = args;
            if (!reason) {
                await interaction.editReply({ content: 'You did not specify a reason for denial, make sure you did the command properly!', ephemeral: true });
                return;
            }
            const channelDB = await tiecketSchema.findOne({ channelID: interaction.channel.id });
            if (!channelDB) {
                await interaction.editReply({ content: 'SOMETHING WENT WRONG! This application cannot be found in our database!', ephemeral: true });
                return;
            }
            const type = await getType(interaction.user.bot, channelDB);
            if (!type) {
                await interaction.editReply({ content: 'SOMETHING WENT WRONG! Doesn\'t seem like this was sent in an application channel.', ephemeral: true });
                return;
            }
            if (!isAllowed(interaction.member, type)) {
                await interaction.editReply({ content: 'You do not have the required roles!', ephemeral: true });
                return;
            }

            const department = type.name;
            const embed = new MessageEmbed()
                .setColor('#FF0000')
                .setAuthor(reason)
                .setDescription(`Hello <@${channelDB.userId}>, your ${department} has been **DENIED**. \n > **Reason: ${reason}.** \n > Supervisor who reviewed your application: ${interaction.member} \n > If you have any questions please let us know.`);
            const messageToDel = await interaction.channel.send({ content: `<@${channelDB.userId}>` });
            messageToDel.delete();
            await interaction.channel.send({ embeds: [embed] });
            await interaction.guild.members.fetch(channelDB.userId);
            const member = await interaction.guild.members.cache.find(member => member.id === channelDB.userId);
            const response = new MessageEmbed()
                .setColor('#FF0000')
                .setAuthor(`${member.user.username}`)
                .setDescription(`${member}, your ${department} has been **DENIED**.`);
            const channel = await interaction.guild.channels.cache.find(channel => channel.id === type.responseChannel);
            await channel.send({ embeds: [response] });
            await interaction.editReply({ content: 'Done.', ephemeral: true });
        }
    }
};

module.exports.config = {
    displayName: 'End Giveaway',
    dbName: 'ENDGIVEAWAY',
    loadDBFirst: true
};
