const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/todos/", async (request, response) => {
  const { status = "", priority = "", search_q = "" } = request.query;
  const getFilteredArray = `
    SELECT
      *
    FROM
     todo
    WHERE 
    status LIKE '%${status}%' AND priority LIKE '%${priority}%' AND todo LIKE '%${search_q}%';`;
  const filteredArray = await database.all(getFilteredArray);
  response.send(filteredArray);
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
     FROM todo
    WHERE id=${todoId};`;
  const todoItem = await database.get(getTodoQuery);
  response.send(todoItem);
});

app.post("/todos/", async (request, response) => {
  const details = request.body;
  const { id, todo, priority, status } = details;
  const postTodoQuery = `
INSERT INTO todo (id, todo, priority, status)
VALUES (${id}, '${todo}', '${priority}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const details = request.body;
  console.log(details);
  let updateColumn = "";
  switch (true) {
    case details.status !== undefined:
      updateColumn = "Status";
      break;
    case details.priority !== undefined:
      updateColumn = "Priority";
      break;
    case details.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const getPreviousTodoQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await database.get(getPreviousTodoQuery);
  //   console.log(previousTodo);
  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
  } = details;
  console.log(status, priority, todo);
  const updateTodoQuery = `
    UPDATE todo 
    SET
      status = '${status}',
      priority = '${priority}',
      todo = '${todo}'
    WHERE
      id = ${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
