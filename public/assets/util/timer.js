
//現在時刻を取得
function getNowTime() {
    nowTime = new Date().getTime();
    return nowTime;
}

//経過時間を計算
function calcElapsedTime(start, end) {
    const elapsedMilliseconds = end - start;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const remainingSeconds = elapsedSeconds % 60;
    return `経過時間: ${elapsedMinutes}分 ${remainingSeconds}秒`;
}

//現在時刻を整形して表示
function showClock(id){
    var nowTime=new Date();
    var nowHour=set2fig(nowTime.getHours());
    var nowMin=set2fig(nowTime.getMinutes());
    var nowSec=set2fig(nowTime.getSeconds());
    var nowMonth=set2fig(nowTime.getMonth()+1);
    var nowDate=set2fig(nowTime.getDate());
    var wDay=nowTime.getDay();
    var Day=['日','月','火','水','木','金','土'];
    var nowClock=nowMonth+"/"+nowDate+"("+Day[wDay]+")"+" "+nowHour+":"+nowMin+":"+nowSec;
    document.getElementById(id).innerHTML=nowClock;
  }
  
  function set2fig(num){
    var ret;
    if(num<10){ret="0"+num;}
      else{ret=num;}
    return ret;
  }
  function set3fig(num){
    var ret;
    if(num<10){ret=" 00"+num;}
     else if(num<100){ret=" 0"+num;}
      else{ret=" "+num;}
    return ret;
  }
  