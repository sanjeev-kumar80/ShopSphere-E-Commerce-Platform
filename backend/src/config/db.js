const mongoose = require("mongoose");

// const connectDB = async () => {
//     try {
//         console.log("URI:", process.env.MONGO_URI);

//         const connection = await mongoose.connect(process.env.MONGO_URI);

//         console.log(`MongoDB connected: ${connection.connection.host}`);
//     } catch (error) {
//         console.error("FULL ERROR:");
//         console.error(error);
//         process.exit(1);
//     }
// }; 
const connectDB = async () => {
    try {
        // console.log(process.env.MONGO_URI);
        const connection = await mongoose.connect(process.env.MONGO_URI);

        console.log(
            `MongoDB connected: ${connection.connection.host}`
        );
    } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error);
    process.exit(1);
}
};

module.exports = connectDB;

