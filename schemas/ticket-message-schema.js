const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true,
};

const tiecketSchema = mongoose.Schema(
    {
        ticketType: reqString,
        msgID: reqString,
    },
);

module.exports = mongoose.model('ticket-messages', tiecketSchema);