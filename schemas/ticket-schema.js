const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const tiecketSchema = mongoose.Schema(
    {
        userId: reqString,
        guildId: reqString,
        type: reqString,
        channelID: reqString,
        expires: {
            type: Date,
            required: false
        },
        current: {
            type: Boolean,
            required: true
        },
        keep: {
            type: Boolean,
            required: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('tickets', tiecketSchema);
