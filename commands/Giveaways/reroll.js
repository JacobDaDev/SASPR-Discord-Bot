/* // Embeds again
const { MessageEmbed } = require('discord.js');

// Incase of an error we need to get the error channel
const { errorChannel, prefix } = require('../config/cfg');

module.exports = {
    name: 'reroll',
    category: 'Giveaways',
    description: `Reroll a giveaway.`,
    testOnly: true,
    minArgs: 1,
    hidden: true,
    slash: true,
    expectedArgs: '<Giveaway ID>',
    options: [
        {
            name: "Giveaway ID",
            description: "ID of the Giveaway Message.",
            type: "STRING",
            required: true,
        },
    ],

    callback: async ({ interaction, args }) => {
        interaction.delete();
        // These embeds are used later, creating them now so it doesn't need to create them every time.
        const invalidPermEmbed = new MessageEmbed()
            .setColor('FF0000')
            .setTitle('Invalid Permissions!')
            .setDescription(`${interaction.author} You don't have the required permissions to use this command.`)
            .setTimestamp()
            .setFooter(interaction.guild.name, client.user.displayAvatarURL());

        const noIDEmbed = new MessageEmbed()
            .setColor('FF0000')
            .setTitle('Which giveaway do you want to reroll?')
            .setDescription(`${interaction.author} You didn't give me a message ID.`)
            .setTimestamp()
            .setFooter(interaction.guild.name, client.user.displayAvatarURL());

        // If the member doesn't have enough permissions
        if(!interaction.member.hasPermission('MANAGE_MESSAGES') && !interaction.member.roles.cache.some((r) => r.name === 'Giveaways')) {
            interaction.channel.send(invalidPermEmbed).then(msg => {
                msg.delete({ timeout: 15000 });
            }).catch((err) => {
                console.error('Error while deleting message: ' + err);
                const messageDelete = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('ERROR!')
                    .addField('Error while deleting message:', `${err}`)
                    .setTimestamp()
                    .setFooter('Time error occured  ', client.user.displayAvatarURL());
                client.channels.cache.get(errorChannel).send(messageDelete);
            });
            return;
        }
        // Giveaway channel
        const giveawayID = args[0];
        // If no channel is mentionned
        if(!giveawayID) {
            interaction.channel.send(noIDEmbed).then(msg => {
                msg.delete({ timeout: 15000 });
            }).catch((err) => {
                console.error('Error while deleting message: ' + err);
                const messageDelete = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('ERROR!')
                    .addField('Error while deleting message:', `${err}`)
                    .setTimestamp()
                    .setFooter('Time error occured  ', client.user.displayAvatarURL());
                client.channels.cache.get(errorChannel).send(messageDelete);
            });
            return;
        }

        // try to found the giveaway with prize then with ID
        const giveaway =
        // Search with giveaway prize
        client.giveawaysManager.giveaways.find((g) => g.prize === args.join(' ')) ||
        // Search with giveaway ID
        client.giveawaysManager.giveaways.find((g) => g.messageID === args[0]);

        // If no giveaway was found
        if(!giveaway) {
            interaction.channel.send('Unable to find a giveaway for `' + args.join(' ') + '`.').then(msg => {
                msg.delete({ timeout: 15000 });
            }).catch((err) => {
                console.error('Error while deleting message: ' + err);
                const messageDelete = new MessageEmbed()
                    .setColor('FF0000')
                    .setTitle('ERROR!')
                    .addField('Error while deleting message:', `${err}`)
                    .setTimestamp()
                    .setFooter('Time error occured  ', client.user.displayAvatarURL());
                client.channels.cache.get(errorChannel).send(messageDelete);
            });
            return;
        }

        // Reroll the giveaway
        client.giveawaysManager.reroll(giveaway.messageID)
            .then(() => {
            // Success message
                interaction.channel.send('Giveaway rerolled!').then(msg => {
                    msg.delete({ timeout: 15000 });
                }).catch((err) => {
                    console.error('Error while deleting message: ' + err);
                    const messageDelete = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while deleting message:', `${err}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(errorChannel).send(messageDelete);
                });
                return;
            })
            .catch((e) => {
                if(e.startsWith(`Giveaway with interaction ID ${giveaway.messageID} is not ended.`)) {
                    interaction.channel.send('This giveaway is not ended!').then(msg => {
                        msg.delete({ timeout: 15000 });
                    }).catch((err) => {
                        console.error('Error while deleting interaction: ' + err);
                        const messageDelete = new MessageEmbed()
                            .setColor('FF0000')
                            .setTitle('ERROR!')
                            .addField('Error while deleting interaction:', `${err}`)
                            .setTimestamp()
                            .setFooter('Time error occured  ', client.user.displayAvatarURL());
                        client.channels.cache.get(errorChannel).send(messageDelete);
                    });
                    return;
                }
                else {
                    console.error(e);
                    interaction.channel.send('An error occured... check your logs or error channel.');
                    const activityErrEmbed = new MessageEmbed()
                        .setColor('FF0000')
                        .setTitle('ERROR!')
                        .addField('Error while trying to restart a giveaway.\nError:', `${e}`)
                        .setTimestamp()
                        .setFooter('Time error occured  ', client.user.displayAvatarURL());
                    client.channels.cache.get(errorChannel).send(activityErrEmbed);

                }
            });


    },

};
module.exports.config = {
    displayName: 'Reroll',
    dbName: 'REROLL',
    loadDBFirst: true,
}; */