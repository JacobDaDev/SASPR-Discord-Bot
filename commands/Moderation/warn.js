/* eslint-disable no-case-declarations */

/*

MOST OF THIS CODE IS FROM Paiz#0617, ALL CREDITS TO THEM!

*/

// UUIDs for warning IDs
/* const uuid = require('uuid');

// Importing the mongoose schema for database
const WarnSchema = require('../../schemas/warnings-schema');

// Embeds
const { MessageEmbed } = require('discord.js');

// Get the config object
const config = require('../../config/cfg');

// Importing the mongoose schema for database
const MuteSchema = require('../../schemas/mute-schema');

module.exports = {
    name: 'warn',
    slash: true,
    testOnly: true,
    description: 'Warn a user, get a list of a user, and remove the warned user!',
    category: 'Moderation',
    options: [
        {
            name: 'add',
            description: 'Warn a user!',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'user',
                    description: 'Provide a user to warn them!',
                    type: 'USER',
                    required: true
                },
                {
                    name: 'reason',
                    description: 'Provide a reason!',
                    type: 'STRING',
                    required: true
                }
            ]
        },
        {
            name: 'list',
            description: 'Get a list of the warned user!',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'user',
                    description: 'Provide a user to get it\'s list',
                    type: 'USER',
                    required: true
                }
            ]
        },
        {
            name: 'remove',
            description: 'Remove a warning from a user!',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'warnid',
                    description: 'Provide a warnID to remove the warned user!',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'user',
                    description: 'Provide a user to remove the warned user!',
                    type: 'USER',
                    required: true
                }
            ]
        }
    ],
    callback: async ({ interaction, args, client }) => {
        const subCommandName = interaction.options._subcommand;

        const user = interaction.options.getUser('user');
        const getWarnId = interaction.options.getString('warnid');

        switch (subCommandName) {
        case 'add':
            const getReason = interaction.options.getString('reason');

            const warnObj = {
                authorId: interaction.user.id,
                timestamp: Math.floor(Date.now() / 1000),
                warnId: uuid.v4(),
                reason: getReason
            };

            const warnAddData = await WarnSchema.findOneAndUpdate(
                {
                    guildId: interaction.guild.id,
                    userId: user.id
                },
                {
                    guildId: interaction.guild.id,
                    userId: user.id,
                    $push: {
                        warnings: warnObj
                    }
                },
                {
                    upsert: true
                }
            );
            const warnCount = warnAddData ? warnAddData.warnings.length + 1 : 1;
            const warnGrammar = warnCount === 1 ? '' : 's';

            interaction.reply({
                content: `Warned **${user.tag}**, They now have **${warnCount}** warning${warnGrammar}`
            });
            break;

        case 'list':
            const warnedResult = await WarnSchema.findOne({
                guildId: interaction.guild.id,
                userId: user.id
            });

            if (!warnedResult || warnedResult.warnings.length === 0) {
                return interaction.reply({
                    content: 'That user has no warning record!',
                    ephemeral: true
                });
            }

            let string = '';
            const embed = new MessageEmbed()
                .setColor('#FFFFF')
                .setDescription(string);

            const getWarnedUser = interaction.guild.members.cache.find(
                (user) => user.id === warnedResult.userId
            );
            for (const warning of warnedResult.warnings) {
                const { authorId, timestamp, warnId, reason } = warning;
                const getModeratorUser = interaction.guild.members.cache.find(
                    (user) => user.id === authorId
                );
                string += embed
                    .addField(
                        `Warn ID: ${warnId} | Moderator: ${getModeratorUser.user.tag}`,
                        `${reason} - <t:${timestamp}>`
                    )
                    .setTitle(`${getWarnedUser.user.username}'s Warning Lists!`);
            }

            interaction.reply({ embeds: [embed] });
            break;

        case 'remove':
            const validateUUID = uuid.validate(getWarnId);

            if (validateUUID) {
                const warnedRemoveData = await WarnSchema.findOneAndUpdate(
                    {
                        guildId: interaction.guild.id,
                        userId: user.id
                    },
                    {
                        $pull: { warnings: { warnId: `${getWarnId}` } }
                    }
                );

                const getRemovedWarnedUser = interaction.guild.members.cache.find(
                    (user) => user.id === warnedRemoveData.userId
                );

                const warnedRemoveCount = warnedRemoveData
                    ? warnedRemoveData.warnings.length - 1
                    : 0;
                const warnedRemoveGrammar = warnedRemoveCount === 1 ? '' : 's';

                interaction.reply({
                    content: `Successfully deleted **${getRemovedWarnedUser.user.tag}** warning, they now have **${warnedRemoveCount}** warning${warnedRemoveGrammar}!`
                });
            } else {
                interaction.reply({
                    content: 'That is not a valid Warn ID!',
                    ephemeral: true
                });
            }

            break;
        }
    }
};

module.exports.config = {
    displayName: 'Unmute',
    dbName: 'UNMUTE',
    loadDBFirst: true
}; */