
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const questions = [
  {
    id: 1,
    type: "multiple",
    question: "함수 f(x) = x²의 도함수는?",
    choices: ["x", "2x", "x²", "2"],
    answer: "2x",
    points: 10
  },
  {
    id: 2,
    type: "short",
    question: "함수 f(x) = 3x²의 도함수를 구하시오.",
    answer: "6x",
    points: 10
  },
  {
    id: 3,
    type: "multiple",
    question: "lim(x→0) sin(x)/x의 값은?",
    choices: ["0", "1", "-1", "존재하지 않는다"],
    answer: "1",
    points: 10
  },
  {
    id: 4,
    type: "short",
    question: "함수 f(x) = x³의 도함수를 구하시오.",
    answer: "3x^2",
    points: 10
  }
];

let leaderboard = [];

function checkTeacher(req, res, next) {
  const password = req.headers["x-teacher-password"];
  const teacherPassword = process.env.TEACHER_PASSWORD;

  if (!teacherPassword) {
    return res.status(503).json({
      error: "교사 비밀번호가 설정되지 않았습니다."
    });
  }

  if (password !== teacherPassword) {
    return res.status(401).json({
      error: "교사 비밀번호가 올바르지 않습니다."
    });
  }

  next();
}

app.get("/api/questions", (req, res) => {
  res.json(questions.map(({ answer, ...q }) => q));
});

app.get("/api/leaderboard", (req, res) => {
  res.json(
    [...leaderboard].sort((a, b) => b.score - a.score)
  );
});

app.post("/api/submit", (req, res) => {
  const { name, answers } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 20 ||
    !Array.isArray(answers)
  ) {
    return res.status(400).json({
      error: "입력 정보를 확인해 주세요."
    });
  }

  if (leaderboard.some(p => p.name === name.trim())) {
    return res.status(409).json({
      error: "이미 제출한 이름입니다."
    });
  }

  let score = 0;
  let correctCount = 0;

  questions.forEach(q => {
    const submitted = answers.find(a => a.id === q.id);
    if (!submitted || typeof submitted.value !== "string") return;

    const normalize = value =>
      value.toLowerCase()
        .replace(/\s+/g, "")
        .replace(/²/g, "^2");

    if (normalize(submitted.value) === normalize(q.answer)) {
      score += q.points;
      correctCount++;
    }
  });

  leaderboard.push({
    name: name.trim(),
    score,
    correctCount,
    submittedAt: Date.now()
  });

  res.json({
    score,
    correctCount,
    total: questions.length
  });
});

// 교사 로그인 확인
app.post("/api/teacher/login", checkTeacher, (req, res) => {
  res.json({ success: true });
});

// 교사용 참가자 목록
app.get("/api/teacher/leaderboard", checkTeacher, (req, res) => {
  res.json(
    [...leaderboard].sort((a, b) => b.score - a.score)
  );
});

// 교사용 순위 초기화
app.post("/api/teacher/reset", checkTeacher, (req, res) => {
  leaderboard = [];
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`CALCULUS LEAGUE server running on port ${PORT}`);
});
