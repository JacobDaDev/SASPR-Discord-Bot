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
    name: 'accept',
    category: 'Applications',
    slash: true,
    hidden: true,
    description: 'Accept a person for a department.',
    testOnly: true,
    // Hello <@>, your ${department} has been denied. \n Reason: ${reason}. \n Supervisor who reviewed your application: ${interaction.member} \n If you have any questions please let us know.
    callback: async ({ interaction }) => {
        if (interaction) {
            await interaction.reply({ content: 'Loading...', ephemeral: true });
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
            await interaction.guild.members.fetch(channelDB.userId);
            const member = await interaction.guild.members.cache.find(member => member.id === channelDB.userId);
            for (const roleID in type.rolesToGive) {
                const role = await interaction.guild.roles.cache.find(role => role.id === type.rolesToGive[roleID]);
                if (role && member) {
                    await member.roles.add(role);
                }
            }
            const embed = new MessageEmbed()
                .setColor('#00FF00')
                .setAuthor('Congratulations!')
                .setDescription(`Hello <@${channelDB.userId}>, your ${department} has been **ACCEPTED**. \n > Supervisor who reviewed your application: ${interaction.member} \n > If you have any questions please let us know.`);
            const messageToDel = await interaction.channel.send({ content: `<@${channelDB.userId}>` });
            messageToDel.delete();
            await interaction.channel.send({ embeds: [embed] });
            const response = new MessageEmbed()
                .setColor('#00FF00')
                .setAuthor(`${member.user.username}`)
                .setDescription(`${member}, your ${department} has been **ACCEPTED**. Welcome!`);
            const channel = await interaction.guild.channels.cache.find(channel => channel.id === type.responseChannel);
            if (channel) {
                await channel.send({ embeds: [response] });
            }
            await interaction.editReply({ content: 'Done.', ephemeral: true });
        }
    }
};

module.exports.config = {
    displayName: 'Accept an applicant',
    dbName: 'ACCEPT',
    loadDBFirst: true
};
