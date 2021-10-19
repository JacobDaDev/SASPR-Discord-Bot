// Mute schema, database info
const muteSchema = require('../schemas/mute-schema');

// Get the config so we can get the correct muted role
const config = require('../config/cfg');

module.exports = (client) => {
    const mutedRoleConf = config.commandConfig.muteRoleName;
    const checkMutes = async () => {
        // Current date
        const now = new Date();
        // Get info wether or not the mute is expired
        const conditional = {
            expires: {
                $lt: now
            },
            current: true
        };
        // Gives the info intself from the constant above
        const results = await muteSchema.find(conditional);
        // If returns true (user should no longer be muted)
        if (results && results.length) {
            for (const result of results) {
                const { guildId, userId } = result;

                const guild = client.guilds.cache.get(guildId);
                const member = (await guild.members.fetch()).get(userId);
                // Get the muted role
                const mutedRole = guild.roles.cache.find((role) => {
                    return role.name === mutedRoleConf;
                });
                if (member.roles.cache.some(role => role.name === mutedRole)) {
                    // Then remove the role since he no longer should be muted
                    member.roles.remove(mutedRole);
                }
            }

            await muteSchema.updateMany(conditional, {
                current: false
            });
        }
        // Make it run every 5 minutes
        setTimeout(checkMutes, 1000 * 60 * 5);
    };
    checkMutes();
    client.on('ready', async () => {
        const guildID = config.settings.guildID;
        const thisGuild = client.guilds.cache.find(guild => {
            return guild.id === guildID;
        });
        const clientMember = thisGuild.members.cache.get(client.user.id);
        let muterole = thisGuild.roles.cache.find(role => {
            return role.name === mutedRoleConf;
        });
        if (!muterole) {
            muterole = await thisGuild.roles.create({
                data: {
                    name: `${mutedRoleConf || 'MUTED'}`,
                    color: '#ff0000',
                    permissions: []
                }
            }).then(console.log(`\nCreated mute role! It's named "${mutedRoleConf}"`)).catch(console.error());
            thisGuild.channels.cache.forEach(async (channel) => {
                try {
                    await channel.permissionOverwrites.create(muterole, {
                        SEND_MESSAGES: false,
                        MANAGE_MESSAGES: false,
                        ADD_REACTIONS: false
                    }).then(muterole.setPosition(clientMember.roles.highest.rawPosition - 1)).catch(console.error());
                } catch (err) {
                    console.error(err);
                }
            });
        }
        // Check the mutes when client is ready
        checkMutes();
    });
    // Making sure people don't try to bypass it by leaving and joining back
    client.on('guildMemberAdd', async (member) => {
        const { guild } = member;
        checkMutes();
        // Getting data from db about the user
        const currentMute = await muteSchema.findOne({
            userId: member.id,
            guildId: guild.id,
            current: true
        });
        // If data returns true (user should still be muted)
        if (currentMute) {
            console.log('Is muted');
            // Get the muted role
            const rolem = guild.roles.cache.find((role) => {
                return role.name === mutedRoleConf;
            });
            console.log(rolem);
            if (rolem) {
                member.roles.add(rolem);
            }
        }
    });
};
module.exports.config = {
    loadDBFirst: true
};
