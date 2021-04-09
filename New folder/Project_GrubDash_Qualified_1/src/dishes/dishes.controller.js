const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

function priceExists(req, res, next) {
  const priceCheck = req.body.data.price;
  if (!priceCheck || priceCheck <= 0  || typeof priceCheck !== "number") {
    next({
      status: 400,
      message: `price`,
    });
  }
  next();
}

function bodyExists(req, res, next) {
  const requiredFields = ["name", "description", "price", "image_url"];
  for (const field of requiredFields) {
    if (!req.body.data[field]) {
      next({
        status: 400,
        message: `"${field}" is required`,
      });
    }
  }
  next();
}

function create(req, res) {
  const { data: { name, description, image_url, price } = {} } = req.body;
  const newData = {
    id: nextId(),
    name,
    description,
    image_url,
    price,
  };
  dishes.push(newData);
  res.status(201).json({ data: newData });
}

function update(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  const { data: { id } = {} } = req.body;
  if (id) {
    if (id !== dishId) {
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
    }
  }
  const updatedDish = Object.assign(foundDish, req.body.data);
  res.json({ data: updatedDish });
}

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}
// TODO: Implement the /dishes handlers needed to make the tests pass
module.exports = {
  update: [dishExists, bodyExists, priceExists, update],
  create: [bodyExists, priceExists, create],
  read: [dishExists, read],
  list,
};
