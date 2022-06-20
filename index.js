// this will be used as the command handler
const WOKCommands = require('wokcommands');
const path = require('path');
// Well we need discord init.
const { Client, Intents } = require('discord.js');
// Define the client and new intents.
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_BANS
    ]
});
const config = require('./config/cfg');
client.config = config;

// this will make console look better lul
const chalk = require('chalk');

// Requires Manager from discord-giveaways
const { GiveawaysManager } = require('discord-giveaways');
// Starts updating currents giveaways
const manager = new GiveawaysManager(client, {
    storage: './giveaways.json',
    updateCountdownEvery: 10000,
    hasGuildMembersIntent: false,
    default: {
        botsCanWin: false,
        exemptPermissions: ['ADMINISTRATOR'],
        embedColor: '#00aeff',
        reaction: '🎉'
    }
});
// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager;

// when the client is restarted this will console log "Ready!" as well as creates a new client for WOKCommands
client.once('ready', async () => {
    // Setting the bot activity
    await client.user.setActivity(`${config.botActivity.activity.name}`, { type: `${config.botActivity.activity.type}` });
    console.log('Activity set to ' + chalk.cyanBright(`${config.botActivity.activity.type}:`) + chalk.cyanBright.bold(` ${config.botActivity.activity.name}`));
    // Setting bot staus
    await client.user.setStatus(config.botActivity.status);
    console.log('Status set to ' + chalk.cyanBright(`${config.botActivity.status.toUpperCase()}`));

    const wok = new WOKCommands(client, {
        commandsDir: path.join(__dirname, 'commands'),
        featuresDir: path.join(__dirname, 'features'),
        testServers: '782325502974754866'
    })
    console.log(chalk.blue(`${client.user.username} is now`) + chalk.green.bold(' ONLINE ') + chalk.blue('and') + chalk.green.bold(' READY! '));
});

// login to Discord
client.login(`${config.settings.token}`).catch(() => {
    console.log(chalk.bold.red('[Error] ') + 'Invalid token provided in config');
});
