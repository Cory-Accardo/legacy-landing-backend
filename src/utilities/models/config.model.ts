import { Schema as _Schema, model } from 'mongoose';

const Schema = _Schema;

const configurationSchema = new Schema({
    service_cut: {
        type: Number,
        required: true,
    },

}, {
    capped: 1,
    collection: 'config'
});

const Config = model('Config', configurationSchema);
export default Config