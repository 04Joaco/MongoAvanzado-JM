import express from "express";
import { Server } from "socket.io";
import productRouter from "./routes/products.router.js";
import cartRouter from "./routes/cart.router.js";
import handlebars from "express-handlebars";
import viewsRouter from "./routes/views.router.js";
import { __dirname } from "./utils.js";
import { ProductManager } from "./dao/ProductManager.js";
import mongoose from "mongoose";
import Message from "./dao/models/messageModel.js";

const app = express();
const PORT = 8080;
const DB_URL = "mongodb://localhost:27017/ecommerce";
const productManager = new ProductManager("productos.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/public"));

app.engine("handlebars", handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/", viewsRouter);

const server = app.listen(PORT, () => {
  console.log("servidor esta iniciado en " + PORT);
});

const socketServer = new Server(server);

socketServer.on("connection", (socket) => {
  console.log("cliente conectado, puede trabajar");
  socket.on("addProduct", async (product) => {
    const title = product.title;
    const description = product.description;
    const price = product.price;
    const thumbnail = product.thumbnail;
    const code = product.code;
    const stock = product.stock;
    try {
      const result = await productManager.addProduct(
        title,
        description,
        price,
        thumbnail,
        code,
        stock
      );
      const allProducts = await productManager.getProducts();
      console.log(allProducts);
      result && socketServer.emit("updateProducts", allProducts);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("deleteProduct", async (id) => {
    console.log(id);
    try {
      const result = await productManager.deleteProductById(id);
      const allProducts = await productManager.getProducts();
      console.log(allProducts);
      result && socketServer.emit("updateProducts", allProducts);
    } catch (err) {
      console.log(err);
    }
  });
});



 Message.find({}, (err, messages) => {
  if (!err) {
    socket.emit("chatMessages", messages);
  }
});
socket.on("chatMessage", async (data) => {
  try {
    const newMessage = new Message({ user: data.user, message: data.message });
    await newMessage.save();
    socketServer.emit("chatMessage", newMessage);
  } catch (err) {
    console.log(err);
  }
});
socket.on("disconnect", () => {
  console.log("Usuario desconectado");
});


mongoose.connect(DB_URL)
  .then(() => {
    console.log("Base de datos conectada");
  })
  .catch((error) => {
    console.log("Error en conexión a base de datos", error);
  });