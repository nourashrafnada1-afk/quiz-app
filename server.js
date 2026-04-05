const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const fs = require("fs");

app.use(express.static("public"));

let users = {};
let quizStarted = false;

// Load saved data
if (fs.existsSync("data.json")) {
  users = JSON.parse(fs.readFileSync("data.json"));
}

// أسئلة
const mcq = [
  { q: "2+2?", options: ["2","3","4","5"], answer: 2 },
  { q: "Capital of Egypt?", options: ["Alex","Cairo","Giza","Luxor"], answer: 1 },
  { q: "5*2?", options: ["10","5","2","8"], answer: 0 },
  { q: "HTML stands for?", options: ["Hyper Text Markup Language","Home Tool","Other","None"], answer: 0 },
  { q: "CSS used for?", options: ["Logic","Style","DB","Server"], answer: 1 },
  { q: "JS is?", options: ["Language","DB","OS","None"], answer: 0 }
];

const written = [
  "Explain HTML",
  "What is CSS?",
  "What is JS?",
  "Explain backend"
];

// حفظ البيانات
function saveData(){
  fs.writeFileSync("data.json", JSON.stringify(users,null,2));
}

io.on("connection", (socket)=>{

  socket.on("join",(name)=>{
    users[socket.id] = {
      id: socket.id,
      name,
      mcqScore: 0,
      writtenScore: 0,
      total: 0
    };
  });

  socket.on("startQuiz",()=>{
    quizStarted = true;
    io.emit("quizStarted",{mcq, written});

    setTimeout(()=>{
      io.emit("quizEnded");
    },300000); // 5 دقائق
  });

  socket.on("submitMCQ",(answers)=>{
    let score = 0;
    answers.forEach((a,i)=>{
      if(a == mcq[i].answer) score += 5;
    });
    users[socket.id].mcqScore = score;
    users[socket.id].total = score;

    saveData();
    io.emit("updateAdmin", users);
  });

  socket.on("addWrittenScore",({id,score})=>{
    if(users[id]){
      users[id].writtenScore = score;
      users[id].total = users[id].mcqScore + score;
      saveData();
      io.emit("updateAdmin", users);
    }
  });

  socket.on("getTop",()=>{
    let sorted = Object.values(users).sort((a,b)=>b.total-a.total);
    socket.emit("top3", sorted.slice(0,3));
  });

});

// 👈 خلي البورت متغير عشان Railway أو Render ياخده تلقائي
const PORT = process.env.PORT || 3000;
http.listen(PORT,()=>console.log(`Server running on port ${PORT}`));