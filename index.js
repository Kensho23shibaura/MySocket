// expressでサーバーを作成
const express = require('express');
const session = require('express-session');
const socketIO = require('socket.io');
// const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// 静的ファイルの提供とキャッシュの有効化
app.use(express.static('public', { maxAge: 86400000 }));
app.use('/assets', express.static('public/assets', { maxAge: 86400000 }));

// ***************************************************************************
// ミドルウェアの実装
const loggerMiddleware = function (req, res, next) {
    const currentDate = new Date();
    const formattedTime = currentDate.toLocaleTimeString('en-US');
    // サーバー側にアクセスログを表示
    if (req.url != '/connectedClients') {
        console.log(`[${formattedTime}] ${req.method} ${req.url}`);
    }
    next(); // 次のミドルウェアへ処理を移す
};
// ミドルウェアの登録
app.use(loggerMiddleware);

// ***************************************************************************
// ユーザー情報の管理
const userDataPath = path.join(__dirname, 'user_data.json');
const loadUserData = () => {
    try {
        const data = fs.readFileSync(userDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};
const saveUserData = (userData) => {
    fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2), 'utf8');
};
const generateUniqueId = () => {
    return Math.random().toString(36).substring(2);
};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ***************************************************************************
// チャット情報の管理
const chatData = {};
let MessagesCount = 0;

const chatDataPath = path.join(__dirname, 'chat_data.json');
// const loadChatData = () => {
//     try {
//         const data = fs.readFileSync(userDataPath, 'utf8');
//         return JSON.parse(data);
//     } catch (error) {
//         return {};
//     }
// };
const saveChatData = (chatData) => {
    fs.writeFileSync(chatDataPath, JSON.stringify(chatData, null, 2), 'utf8');
};

// ***************************************************************************
// 回答情報の管理
const answerDataPath = path.join(__dirname, 'answer_data.json');
const loadAnswerData = () => {
    try {
        const data = fs.readFileSync(answerDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};
const saveAnswerData = (answerData) => {
    fs.writeFileSync(answerDataPath, JSON.stringify(answerData, null, 2), 'utf8');
};

// ***************************************************************************
// プレイヤーの初回アクセス
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// プレイヤーの入室
app.post('/join', (req, res) => {
    const { username } = req.body;
    if (!username) {
        res.status(400).send('Username is required.');
        return;
    }

    // 新しいクライアントIDを生成・保存
    const userData = loadUserData();
    const clientId = generateUniqueId();
    while (userData[clientId]) {
        clientId = generateUniqueId();
    }
    // const token = 'aaaaaaaaaaaa'
    // const level = 1
    userData[clientId] = { username };
    saveUserData(userData);

    // /game/:id にリダイレクト
    res.redirect(`/game/${clientId}`);
});

// プレイヤー用ゲーム画面に遷移
app.get('/game/:id', (req, res) => {
    const clientId = req.params.id;
    const userData = loadUserData();

    if (!userData[clientId]) {
        res.status(404).send('User not found.');
        return;
    }
    const username = userData[clientId].username;
    // 遷移先のhtmlファイルを読み込み
    const filePath = path.join(__dirname, 'private', 'game.html');
    let fileContent = fs.readFileSync(filePath, 'utf8');
    // 遷移先のコンテンツを書換え
    fileContent = fileContent.replace('{clientId}', clientId);
    fileContent = fileContent.replace('{username}', username);
    res.send(fileContent);
});

// ***************************************************************************
// パスワードの設定（実際のアプリケーションでは安全な方法で保管すること）
const adminPassword = 'admin123';
app.use(session({
    secret: 'ex_secret_ken_system1224', // 安全なランダムな文字列に置き換えるべき
    resave: false,
    saveUninitialized: true,
}));

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/authenticate', (req, res) => {
    const { password } = req.body;

    // パスワードが一致するか確認
    if (password === adminPassword) {
        req.session.authenticated = true;
        res.sendStatus(200); // 認証成功
    } else {
        res.sendStatus(401); // 認証失敗
    }
});
app.get('/admin', (req, res) => {
    if (req.session.authenticated) {
        res.sendFile(path.join(__dirname, 'private/admin.html'));
    } else {
        res.redirect('/login');
    }
});

// ***************************************************************************
// 接続人数カウント
let connectedClientsCount = 0;
// 問題管理
let questionNumber = 0;
let questionAnswer;
let answeredClientsCount = 0;
let userAnswers = loadAnswerData();

io.on('connection', (socket) => {
    connectedClientsCount++;
    socket.on('disconnect', () => {
        connectedClientsCount--;
        io.emit('updateCount', connectedClientsCount);
    });
    // ユーザからのメッセージ送信用(管理者向け)
    socket.on('/sendChatToHost', (id, message) => {
        const userData = loadUserData();
        const username = userData[id] ? userData[id].username : 'Unknown User';
        // ユーザ名とメッセージを保存
        chatData[MessagesCount] = { username, message };
        MessagesCount++;
        saveChatData(chatData);
        // 管理者画面にユーザ名とメッセージを表示
        io.emit('showChatToHost', username, message);
    });
    // ユーザからのメッセージ送信用(全員向け)
    socket.on('/sendChatToAll', (id, message) => {
        const userData = loadUserData();
        const username = userData[id] ? userData[id].username : 'Unknown User';
        // ユーザ名とメッセージを保存
        chatData[MessagesCount] = { username, message };
        MessagesCount++;
        saveChatData(chatData);
        // 管理者画面にユーザ名とメッセージを表示
        io.emit('showChatToAll', username, message);
    });
    // 管理者からのメッセージ一斉送信用
    socket.on('/broadcastToAll', (message) => {
        const username = '管理者';
        // ユーザ名とメッセージを保存
        chatData[MessagesCount] = { username, message };
        MessagesCount++;
        saveChatData(chatData);
        // 管理者画面にユーザ名とメッセージを表示
        io.emit('showChatToAll', username, message);
    });
    // 接続人数のカウント用
    socket.on('/updateCount', () => {
        socket.emit('updateCount', connectedClientsCount, answeredClientsCount);
    });

    // 問題出題用(管理者)
    socket.on('/sendQuestionByHost', (Question, CorrectAnswer) => {
        questionNumber = Question.no;
        questionAnswer = CorrectAnswer;
        answeredClientsCount = 0;
        userAnswers = loadAnswerData();
        // 問題出題(参加者)
        io.emit('showQuestion', Question, null);
    });
    // 問題回答(参加者)
    socket.on('/sendAnswer', (id, Answer) => {
        answeredClientsCount++;
        if (!userAnswers[id]) {
            userAnswers[id] = {};
        }
        // 正誤判定
        let Result = null;
        let date = new Date();
        if (questionAnswer != null) {
            if (questionAnswer == Answer) {
                Result = true;
            }else{
                Result = false;
            }
        }
        userAnswers[id][questionNumber] = { Result, Answer, answeredClientsCount, date }
        if (Result != null){
            // 正誤判定送付(即時判定可能時のみ)
            socket.emit('showAnswer', id, Result);
        }
    });
    // 回答終了(管理者)
    socket.on('/stopQuestionByHost', () => {
        saveAnswerData(userAnswers);
        // 回答終了(参加者)
        io.emit('stopQuestion');
    });
    // 結果送付(管理者)
    socket.on('/sendAnswerByHost', (Question, CorrectAnswer) => {
        saveAnswerData(userAnswers);
        //集計処理
        let answerDistribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
        for (let id in userAnswers) {
            let userResult = userAnswers[id];
            for (let questionNum in userResult) {
                if (questionNum == questionNumber) {
                    answerDistribution[userResult[questionNum].Answer]++;
                }
            }
        }
        // 修正処理
        Question.answerA = Question.answerA + '<br><br>' + answerDistribution['A'] + '人';
        Question.answerB = Question.answerB + '<br><br>' + answerDistribution['B'] + '人';
        Question.answerC = Question.answerC + '<br><br>' + answerDistribution['C'] + '人';
        Question.answerD = Question.answerD + '<br><br>' + answerDistribution['D'] + '人';
        if (CorrectAnswer == null){
            CorrectAnswer = Object.keys(answerDistribution).reduce((a,b)=>answerDistribution[a]>answerDistribution[b]? a:b);
        }
        // 結果表示(参加者)
        io.emit('showQuestion', Question, CorrectAnswer);
    });
    // 順位表示(管理者)
    socket.on('/showRankByHost', () => {
        saveAnswerData(userAnswers);
        const userData = loadUserData();

        //集計処理
        let aggregateResults = {};
        for (let id in userAnswers) {
            let userResult = userAnswers[id];
            let correctCount = 0;
            let speedBounus = 0;

            for (let questionNum in userResult) {
                if (userResult[questionNum].Result) {
                    correctCount++;
                    if (userResult[questionNum].answeredClientsCount <= 3) {
                        speedBounus++;
                    }
                }
            }
            let username = userData[id].username;
            aggregateResults[id] = { username, correctCount, speedBounus };
        }
        // 順位表示(参加者)
        io.emit('showRank', aggregateResults);
    });
    // 回答記録初期化用
    socket.on('/resetQuestion', () => {
        userAnswers = {};
        saveAnswerData(userAnswers);
    });
});

// ***************************************************************************
// サーバーの開始
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});