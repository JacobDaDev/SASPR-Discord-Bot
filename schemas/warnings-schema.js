const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true,
};

const warnSchema = mongoose.Schema(
    {
        userId: reqString,
        userTag: reqString,
        guildId: reqString,
        reason: reqString,
        staffId: reqString,
        staffTag: reqString,
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('warnings', warnSchema);