const PROTO_PATH = "./restaurant.proto";

var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true,
});

var restaurantProto = grpc.loadPackageDefinition(packageDefinition);

// read config
const res = require("dotenv").config({
    path: "./config.env",
});
if (res.error) {
    throw new Error("Failed to load config");
} else {
    console.log("Config loaded");
}

// mongoose connection
const mongoose = require("mongoose");
conn = mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.connection.on("connected", () => {
    console.log("Mongoose is connected");
});

const Menu = require("../model/Menu");

// Start gRPC Server
const server = new grpc.Server();

// Init gRPC Sevice
server.addService(restaurantProto.RestaurantService.service, {
    getAllMenu: async (_, callback) => {
        try {
            const menu = await Menu.find();
            callback(null, { menu });
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: error.message,
            });
        }
    },
    get: async (call, callback) => {
        try {
            const menuItem = await Menu.findOne({ id: call.request.id });
            if (menuItem) {
                callback(null, menuItem);
            } else {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "Not found",
                });
            }
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: error.message,
            });
        }
    },
    insert: async (call, callback) => {
        try {
            const menuItem = call.request;
            const newMenu = new Menu({
                name: menuItem.name,
                price: menuItem.price,
            });
            await newMenu.save();
            callback(null, menuItem);
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: error.message,
            });
        }
    },
    update: async (call, callback) => {
        try {
            let existingMenuItem = await Menu.findByIdAndUpdate(
                call.request.id,
                {
                    name: call.request.name,
                    price: call.request.price,
                }
            );
            if (existingMenuItem) {
                callback(null, existingMenuItem);
            } else {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "Not found",
                });
            }
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: error.message,
            });
        }
    },
    remove: async (call, callback) => {
        try {
            const existingMenuItem = await Menu.findByIdAndDelete(
                call.request.id
            );
            if (existingMenuItem) {
                callback(null, existingMenuItem);
            } else {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "Not found",
                });
            }
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: error.message,
            });
        }
    },
});

server.bindAsync(
    "127.0.0.1:30043",
    grpc.ServerCredentials.createInsecure(),
    () => {
        server.start();
    }
);
console.log("Server running at http://127.0.0.1:30043");
