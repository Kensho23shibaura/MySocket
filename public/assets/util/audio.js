//オーディオ再生関連utilメソッド
/*
-----使い方----
playAlarm(audioPath[,loop]);
  >>音源を再生する
  >>重複再生防止は付けていないのでplayAlarmの呼び出し元で制御が必要
    audioPath(String) :音源ファイルのパス
    loop(Boolean):省略可、音源再生終了後の再度再生するかを指定可能.

    Ex.)    const alarm1 = playAlarm('path/to/alarm1.mp3', true); //ループ再生
            const alarm2 = playAlarm('path/to/alarm2.mp3', false); //通常再生
            alarm1.stop() //単独停止

stopAllAlarms();
  >>全ての音源の再生を停止する
    Ex.)　  stopAllAlarms(); //一斉停止
*/

let audioObjects = [];

function playAlarm(audioPath, loop = false) {
    // Audio要素を作成
    const audio = new Audio(audioPath);

    // アラームが終了した時の処理
    audio.addEventListener('ended', function () {
        if (loop) {
            // ループ再生の場合、アラームが終了したら再度再生
            audio.play();
        }
    });

    audio.play();

    // オブジェクトに追加して参照を保持
    const audioObject = {
        audio: audio,
        stop: function () {
            // 停止メソッド
            audio.pause();
            audio.currentTime = 0;
            if (loop) {
                audio.removeEventListener('ended', arguments.callee);
            }
        }
    };

    // 参照を保存
    audioObjects.push(audioObject);

    return audioObject;
}

function stopAllAlarms() {
    // 全てのアラームを停止
    audioObjects.forEach(audioObject => audioObject.stop());
    audioObjects = [];
}
