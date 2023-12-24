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
    // サーバー側にアクセスログを表示
    if (req.url != '/connectedClients') {
        console.log(`[${new Date()}] ${req.method} ${req.url}`);
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
    return Math.random().toString(36).substring(7);
};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ***************************************************************************
// チャット情報の管理
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
// ユーザ名とメッセージを保持する変数
const chatData = {};
let MessagesCount = 0;
// ユーザからのメッセージ送信用(管理者向け)
app.post('/sendChatToHost/:id', (req, res) => {
    const { message } = req.body;
    const clientId = req.params.id;
    const userData = loadUserData();
    const username = userData[clientId] ? userData[clientId].username : 'Unknown User';
    // ユーザ名とメッセージを保存
    chatData[MessagesCount] = { username, message };
    MessagesCount++;
    saveChatData(chatData);
    // 管理者画面にユーザ名とメッセージを表示
    io.emit('showChatToHost', { username, message });
});
// ユーザからのメッセージ送信用(全員向け)
app.post('/sendChatToAll/:id', (req, res) => {
    const { message } = req.body;
    const clientId = req.params.id;
    const userData = loadUserData();
    const username = userData[clientId] ? userData[clientId].username : 'Unknown User';
    if (!userData[clientId]) {
        res.status(404).send('User not found.');
        return;
    }
    // ユーザ名とメッセージを保存
    chatData[MessagesCount] = { username, message };
    MessagesCount++;
    saveChatData(chatData);
    // 管理者画面にユーザ名とメッセージを表示
    io.emit('showChatToAll', { username, message });
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
// 管理者からのメッセージ一斉送信用
app.post('/broadcastToAll', (req, res) => {
    if (req.session.authenticated) {
        const { message } = req.body;
        const username = '管理者';
        // ユーザ名とメッセージを保存
        chatData[MessagesCount] = { username, message };
        MessagesCount++;
        saveChatData(chatData);
            // 管理者画面にユーザ名とメッセージを表示
        io.emit('showChatToAll', { username, message });
    }
});

// ***************************************************************************
// 接続人数カウント
let connectedClientsCount = 0;
io.on('connection', (socket) => {
    console.log('A client connected');
    connectedClientsCount++;
    socket.on('disconnect', () => {
        console.log('A client disconnected');
        connectedClientsCount--;
        updateConnectedClientsCount();
    });
});
app.get('/connectedClients', (req, res) => {
    res.json({ count: connectedClientsCount });
});
function updateConnectedClientsCount() {
    io.emit('updateConnectedClients', connectedClientsCount);
}


// ***************************************************************************
// サーバーの開始
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});