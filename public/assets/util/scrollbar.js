function addSideScroll(id) {
    const scrollContainer = document.getElementById(id);
    scrollContainer.addEventListener('wheel', (event) => {
        // マウスホイールのイベントを取得
        event.preventDefault(); // デフォルトのスクロールを無効にする
        // マウスホイールの deltaY プロパティを使用してスクロール方向を取得
        const direction = event.deltaY > 0 ? 1 : -1;
        // スクロール量を設定
        const scrollAmount = 50;
        // 横スクロール位置を調整
        scrollContainer.scrollLeft += scrollAmount * direction;
    });
}
