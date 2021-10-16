// ░█████╗░░█████╗░███╗░░██╗███████╗██╗░██████╗░	███████╗░█████╗░██████╗░	██╗░░░██╗░█████╗░██╗░░░██╗
// ██╔══██╗██╔══██╗████╗░██║██╔════╝██║██╔════╝░	██╔════╝██╔══██╗██╔══██╗	╚██╗░██╔╝██╔══██╗██║░░░██║
// ██║░░╚═╝██║░░██║██╔██╗██║█████╗░░██║██║░░██╗░	█████╗░░██║░░██║██████╔╝	░╚████╔╝░██║░░██║██║░░░██║
// ██║░░██╗██║░░██║██║╚████║██╔══╝░░██║██║░░╚██╗	██╔══╝░░██║░░██║██╔══██╗	░░╚██╔╝░░██║░░██║██║░░░██║
// ╚█████╔╝╚█████╔╝██║░╚███║██║░░░░░██║╚██████╔╝	██║░░░░░╚█████╔╝██║░░██║	░░░██║░░░╚█████╔╝╚██████╔╝
// ░╚════╝░░╚════╝░╚═╝░░╚══╝╚═╝░░░░░╚═╝░╚═════╝░	╚═╝░░░░░░╚════╝░╚═╝░░╚═╝	░░░╚═╝░░░░╚════╝░░╚═════╝░
module.exports = {
    settings: {
        // Default prefix.
        prefix: '',
        // Your bot token, DO NOT SHOW THIS TO ANYONE!!!
        token: '',
        // Your database URI.
        MONGO_URI: '',
        // The guild ID.
        guildID: '',
        // The guild Icon.
        guildIcon: '',
    },
    // Bot activity settings.
    botActivity: {
        // The status you want the bot to be on, can be 'available', 'idle', 'dnd', or 'invisible'.
        status: '',
        activity: {
            // What you want the activity to say.
            name: '',
            // What type you want it to be, can be 'WATCHING', 'PLAYING', 'STREAMING', or 'WATCHING'.
            type: '',
        },
    },
    antiAdSpam: {
        bypassRoles: ['', '', ''],
        bypassMembers: [''],
        allowedInvite: [''],
        amountOfUserMentionsInOneMessage: 4,
        amountOfRoleMentionsInOneMessage: 4,
        messagesBeforeWarn: 5,
        restrictedWords: [],
    },
    logging: {
        // Channel where all the logs will go.
        loggingChannel: '',
        // Channel where bot will send the errors, so you don't have to check logs all the time.
        errorChannel: '',
        // Wether you want to log errors. THIS IS HIGHLY RECOMMENDED TO KEEP TRUE.
        logErrors: true,
        // Wether you want to log deleted messages or not, set to false if you don't want to log them, set to true if you want to log them.
        logDeleteMessage: true,
        // Wether you want to log edited messages or not, set to false if you don't want to log them, set to true if you want to log them.
        logUpdateMessage: true,
        // Wether you want to log channels created or not, set to false if you don't want to log them, set to true if you want to log them.
        logCreateChannel: true,
        // Wether you want to log channels editer or not, set to false if you don't want to log them, set to true if you want to log them.
        logUpdateChannel: true,
        // Wether you want to log channels deleted or not, set to false if you don't want to log them, set to true if you want to log them.
        logDeleteChannel: true,
        // Logs messages to whatever channel you would like
        messageLoggingChannel:'' 
    },
    commandConfig: {
        // Roles allowed to use ALL of the moderation commands, give their ID's.
        modRoles: '' || '' || '',
        muteMember: {
            // Roles allowed to add and remove roles, give the role ID's. Leave blank if you only want the mod roles to be able to use this.
            allowedRoles: '' || '',
            // Change this to anything you want, the bot will create the role for you.
            muteRoleName: 'Muted',
        },
        addRemoveRole: {
            // Roles allowed to add and remove roles, give the role ID's. Leave blank if you only want the mod roles to be able to use this.
            allowedRoles: '' || '',
        },
        warnMember: {
            // Roles allowed to roles allowed to warn members, give the role ID's. Leave blank if you only want the mod roles to be able to use this.
            allowedRoles: '',
            // Amount of warnings before member is muted, set to 0 if you don't want to mute them.
            warnsBeforeMute: 4,
        },
    },
    giveaways: {
        // Wether or not you want to display the giveaway host in the giveaway message, set to false if you don't want to display it.
        hostedBy: true,
        // Wether or not you want to mention everyone when a giveaway starts, set to false if you don't want to display it.
        everyoneMention: false,
    },
    tickets: {
        supportRoles: '' || '',
        createTicketToCategory: '',
        differentTypes: {
            example1: {
                createTicketChannel: '',
                name: '',
                allowedRoles: [''],
                allowedPeople: [''],
                TicketText: '',
                createTo: '',
                Emoji: '',
            },
            example2: {
                createTicketChannel: '',
                name: '',
                allowedRoles: [''],
                allowedPeople: [''],
                TicketText: '',
                createTo: '',
                Emoji: '',
            },
        },
    },
    applications: {
        createTicketChannel: '',
        differentTypes: {
            example1: {
                name: '',
                rolesToGive: [''],
                application: '',
                allowedRoles: [''],
                responseChannel: '',
                allowedPeople: [''],
                TicketText: '',
                createTo: '',
                Emoji: '',
            },
            example2: {
                name: '',
                rolesToGive: ['', ''],
                application: '',
                allowedRoles: [''],
                responseChannel: '',
                allowedPeople: [''],
                TicketText: '',
                createTo: '',
                Emoji: '',
            },
        },
    },
};