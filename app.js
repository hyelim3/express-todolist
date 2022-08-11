// app.js
// "type": "module"을 추가해주지않으면 commonJS방식인 require을 써야한다.
// "type":
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import axios from "axios";
import path from "path";
const __dirname = path.resolve();

const app = express();

app.use(cors());
app.use(express.json()); //json을 쓸 수 있다 할 일 수정
app.use(cors());

const port = 4000;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "a9",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getData = async () => {
  //fetch, axios 정보를 불러옴 서버통신
  const data = await axios.get("http://localhost:3000/todos");
  console.log("async await", data);
};

app.get("/todos/:id/:contentId", async (req, res) => {
  // params 여러개 받기
  const data = {
    todos: {
      id: req.params.id,
      contentId: req.params.contentId,
    },
  };

  const {
    todos: { id, contentId },
  } = data;

  console.log("id", id);
});

app.get("/todos", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM todo ORDER BY id DESC");

  //getData();
  res.json(rows);
});

app.get("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const [[todo]] = await pool.query(
    `
    select *
    from todo
    where id = ?
    `,
    [id]
  );
  if (!todo) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }
  res.json(todo);
});

//추가
app.post("/todos", async (req, res) => {
  const {
    body: { text },
  } = req;
  console.log(text);

  await pool.query(
    `
    INSERT INTO todo
    SET reg_date = NOW(),
    perform_date = '2022-08-12 12:13:14',
    checked = 0,
    text = ?
    `,
    [text]
  );

  const [updatedTodos] = await pool.query(
    `
    SELECT *
    FROM todo
    ORDER BY id DESC
    `
  );
  res.json(updatedTodos);
});

// 할 일 수정
app.patch("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { perform_date, text } = req.body;

  const [rows] = await pool.query(
    `
    select *
    from todo
    where id = ?
    `,
    [id]
  );

  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
  }

  if (!perform_date) {
    res.status(400).json({
      msg: "perform_date required",
    });
    return;
  }

  if (!text) {
    res.status(400).json({
      msg: "text required",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    update todo
    set perform_date =?,
    text = ?
    where id =?
    `,
    [perform_date, text, id]
  );

  const [updatedTodos] = await pool.query(
    `
    SELECT *
    FROM todo
    ORDER BY id DESC
    `
  );

  res.json(updatedTodos);
});

// 받아오는 거 확인
// console.log("id", id);
// console.log("perform_date", perform_date);
// console.log("content", content);

app.patch("/todos/check/:id", async (req, res) => {
  const { id } = req.params; //id값을 받아옴
  const [[todoRow]] = await pool.query(
    //할일을 왜 뽑나? 할일이 없을 수도 있음
    `
  SELECT *
  FROM todo
  WHERE id = ?
  `,
    [id]
  );
  if (!todoRow) {
    //만약 체크요청을 보냈는데 할일이 없다면
    res.status(404).json({
      //에러처리
      msg: "not fount",
    });
    return;
  }
  await pool.query(
    //진짜 업데이트해줘야함 //포스트맨
    `  
    UPDATE todo
    SET checked =?
    WHERE id =?
    `,
    [!todoRow.checked, id] //이전 상태를 체크 true를 불러왔으면 반전된 값이 들어옴
  );

  const [updatedTodos] = await pool.query(
    `
    SELECT *
    FROM todo
    ORDER BY id DESC
    `
  );
  res.json(updatedTodos); //react(보낸사람)한테 반환해줌
});

app.delete("/todos/check/:id", async (req, res) => {
  const { id } = req.params;
  const [[todoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE id = ?
    `,
    [id]
  );
  if (todoRow === undefined) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  await pool.query(
    `
  DELETE
  FROM todo 
  WHERE id = ? `,
    [id]
  );

  const [updatedTodos] = await pool.query(
    `
    SELECT *
    FROM todo
    ORDER BY id DESC
    `,
    [id]
  );
  res.json(updatedTodos);
});

// 할일 삭제
app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const [[todoRow]] = await pool.query(
    `
    select *
    from todo
    where id =?
    `,
    [id]
  );

  //underfined: 정의되지 않았다 없다.
  if (todoRow === undefined) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  const [rs] = await pool.query(
    `
  delete 
  from todo 
  where id = ? `,
    [id]
  );

  res.json({
    msg: `${id}번 할 일이 삭제되었습니다.`,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
