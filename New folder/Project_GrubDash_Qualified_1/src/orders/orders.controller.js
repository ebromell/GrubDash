const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function create(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function bodyExists(req, res, next) {
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
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

function dishExist(req, res, next) {
  const checkDish = req.body.data.dishes;
  if (!checkDish || checkDish.length === 0 || !Array.isArray(checkDish)) {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  next();
}
function orderQuantity(req, res, next) {
  const checkQuantity = req.body.data.dishes;
  let index = checkQuantity.findIndex(
    (dish) =>
      dish.quantity <= 0 || !dish.quantity || typeof dish.quantity !== "number"
  );
  if (index > -1) {
    next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  next();
}

function orderMatch(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id) {
    if (id !== orderId) {
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
      });
    }
  }
  next();
}

function orderStatus(req, res, next) {
  const status = req.body.data.status;
  if (!status || status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
}

function pendingOrder(req, res, next) {
  const status = res.locals.order.status;
  if (status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

function update(req, res, next) {
  const { id } = res.locals.order;
  const updatedOrder = Object.assign(res.locals.order, req.body.data, { id });
  res.json({ data: updatedOrder });
}

function destroy(req, res, next) {
  const index = orders.findIndex((order) => order.id === res.locals.order);
  orders.splice(index, 1);
  res.sendStatus(204);
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function list(req, res, next) {
  res.json({ data: orders });
}

module.exports = {
  update: [
    orderExists,
    bodyExists,
    dishExist,
    orderStatus,
    orderQuantity,
    orderMatch,
    update,
  ],
  create: [bodyExists, dishExist, orderQuantity, create],
  delete: [orderExists, pendingOrder, destroy],
  read: [orderExists, read],
  list,
};
