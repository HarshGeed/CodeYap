import mongoose from 'mongoose';

export async function connect(){
    try{
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI environment variable is not defined.");
        }
        mongoose.connect(mongoUri);
        const connection = mongoose.connection;

        connection.on('connected', () => {
            console.log("MongoDB connected successfully")
        })

        connection.on('error', (err: Error) => {
            console.log('MongoDB connection error. Please make sure mongoDB is running' + err);
            process.exit(1);
        })
    }catch(error){
        console.log("Something went wrong")
        console.log(error)
    }

}