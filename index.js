const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({}, (err, results) => {
    if (results.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: results });
    }
  });
});

app.post("/", (req, res) => {
  console.log(req.body);
  const { newItem, list } = req.body;
  console.log(list);
  const item = new Item({
    name: newItem,
  });
  if (list === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: list }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + list);
    });
  }
});

app.post("/delete", (req, res) => {
  const { checkBox, listName } = req.body;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkBox, (err) => {
      if (!err) {
        console.log("cool");
      } else {
        console.log(err);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkBox } } },
      (err, result) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {});

app.get("/:custom", (req, res) => {
  // const { custom } = req.params;
  const custom = _.capitalize(req.params.custom);
  List.findOne({ name: custom }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: custom,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + custom);
        console.log("Doesn't exist");
      } else {
        //show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
        console.log("exists");
      }
    }
  });
});
