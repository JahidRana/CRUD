const express = require("express");
const app = express();
const cors = require("cors");
const userRouter = require("./routes/user.route");
const testRouter = require("./routes/test.route");
const fileUpload = require('express-fileupload');

require("./config/db");


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(
  fileUpload({ useTempFiles: true })
);



app.use("/users", userRouter);

app.use("/check", testRouter);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/./views/index.html");
});

//invalid route
app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found",
  });
});

module.exports = app;
