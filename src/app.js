import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import expressLayouts from "express-ejs-layouts";
const app = express();
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";

require("dotenv").config();

//EJS
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "chat/views"));
app.use(express.static(__dirname + "chat/public"));

//body parser
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(cookieParser());

//routers
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("Chat App");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started");
});
module.exports = app;
