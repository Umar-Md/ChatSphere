const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        console.error('Database connection failed:', error.message || error.name);
        return;
    }

    console.log('MongoDB Connected Successfully');

    try {

        // =====================================================
        // ENABLE CHANGE STREAM PRE-IMAGES
        // =====================================================
        // Required by the self-destruct message watcher.
        //
        // MongoDB needs the document's previous version when
        // a TTL index deletes the message.
        // =====================================================

        const db = mongoose.connection.db;

        const collections = await db
            .listCollections({ name: 'messages' })
            .toArray();

        if (collections.length === 0) {
            try {
                await db.createCollection('messages', {
                changeStreamPreAndPostImages: {
                    enabled: true,
                },
                });
            } catch (error) {
                // Mongoose may create this collection while startup is running.
                if (error.code !== 48 && error.codeName !== 'NamespaceExists') throw error;
                await db.command({
                    collMod: 'messages',
                    changeStreamPreAndPostImages: { enabled: true },
                });
            }

            console.log(
                'Messages collection created with change stream pre-images enabled'
            );
        } else {
            await db.command({
                collMod: 'messages',
                changeStreamPreAndPostImages: {
                    enabled: true,
                },
            });

            console.log(
                'MongoDB change stream pre-images enabled for messages collection'
            );
        }
    } catch (error) {
        console.error('MongoDB connected, but message pre-image setup failed:',
            error.message || error.name, 'code:', error.code || 'unknown');
    }
};

module.exports = connectDB;
