const express = require("express");
var bodyParser = require("body-parser");
const route = require("./routes/route.js");
const app = express();
const mongoose = require("mongoose");

app.use(bodyParser.json());

mongoose
  .connect(
    "mongodb+srv://Joy-DB:joy123@cluster0.e8rbz.mongodb.net/Blogging_website",
    { useNewUrlParser: true }
  )
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

app.use("/", route);

app.listen(3000, function () {
  console.log("Express app running on port " + 3000);
});
