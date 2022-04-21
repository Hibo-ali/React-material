const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models'); // changed: REMOVED THOUGHT
const { signToken } = require('../utils/auth');


const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                
                return userData;
            }

            throw new AuthenticationError('Not logged in');
        },
    },
    Mutation: {
        addUser: async (parent, {username, email, password}) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },
        loginUser: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user };
        },
        saveTour: async (parent, args, context) => {  
            if (context.user) {

                const user = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedTours: {...args} } }, 
                    { new: true, runValidators: true }
                );
                return user;
            }
            throw new AuthenticationError('You need to be logged in!');
        },
        
        removeTour: async (parent, args, context) => {
            if(context.user) {
                const user = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedTours: { tourId: args.tourId } }},
                    { new: true }
                );

                return user;
            }

            throw new AuthenticationError('You need to be logged in to cancel a tour.');
        }
    }
};
module.exports = resolvers;