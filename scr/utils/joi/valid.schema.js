import Joi from 'joi'

export default {
    users : Joi.object({
        userId: Joi.string().pattern(new RegExp('^[a-z0-9]{5,15}$')).required(),
        name: Joi.string().min(3).max(15).required(),
        password: Joi.string().min(6).max(40).required()
    }),
}
