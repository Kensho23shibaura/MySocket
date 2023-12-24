// エリアの表示/非表示を変更
function updateDisplay(elementIds, newStyle) {
    for (const id of elementIds) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = newStyle;
        }
    }
}

//エリア内のアイテムを全削除
function resetItemInArea(resetType) {
    resetType.forEach(function (type) {
        var area = document.getElementById(`Area_${type}`);
        var items = document.getElementsByClassName(`Item_${type}`);
        Array.from(items).forEach(function (element) {
            area.removeChild(element);
        });
    });
}

//タブ切り替え
function selectTab(AreaName, ItemName, Tab = "A") {
    var Area_List = document.getElementsByClassName(AreaName);
    Array.from(Area_List).forEach(function (element) {
        element.style.display = 'none';
    })
    document.querySelectorAll('.Selected').forEach(element => {
        element.classList.remove('Selected');
    });
    document.getElementById(`${AreaName}${Tab}`).style.display = 'grid';
    document.getElementById(`${ItemName}${Tab}`).classList.add('Selected')
}
