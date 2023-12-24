
function showWindowSize(){
    // 現在の画面サイズを取得
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    // コンソールに出力
    console.log('画面サイズ: ' + screenWidth + ' x ' + screenHeight);
}