//ここからバナーとアラート・ポップアップ
/*
-----使い方----
banner(title,text [,detail]);
  >>バナーを使う（バナーは10秒で自動的に消える）
    title(String) :バナーのタイトル
    text(String)  :バナーの内容、タグの使用可能
    detail(String):省略可、バナータッチ時に表示するポップアップの本文、タグの使用可能.

    Ex.)　banner("test","これはテスト","これはテストです。");

showAlert(title,txt[,popup[,fn]])
  >>ポップアップを使う。Okを押さなくても100秒後に閉じる
  title(String) :ポップアップのタイトル
  txt(String)   :バナーの内容、タグの使用可能
  popup(String) :省略可、デフォルトはhidden.

    -hidden  デフォルト値. 100秒で自動的に閉じるアラート。OKボタンのみある。fnを実行する。
    -noClose 自動的には閉じないアラート。OKボタンのみある。fnを実行する。
    -その他   自動的に閉じないコンファーム。キャンセルを押すと何もしない、OKを押すとfnを実行する

  fn(String)    :省略可。関数名もしくは function(){} を直接記述。OKを押した後に実行される。' or " で囲む必要あり。

  Ex.)　showAlert('テストです','このコンファームはテストです。','confirm','banner("やったー","コンファームが無事使えたよ！")');
        showAlert('テスト','自動的に消えます。');

*/
//ここからバナー
function banner(title,text,detail = text){
    var div = document.createElement('div');
    div.className = "banner";
    div.setAttribute("onclick","this.style.animation='animation-banner-up 0.5s';showAlert('"+title+"','"+detail+"','noClose')");
    var h1 = document.createElement('h2');
    h1.innerHTML = title;
    var p = document.createElement('p');
    p.innerHTML = text;
    div.appendChild(h1);
    div.appendChild(p);
    document.getElementsByTagName('body')[0].appendChild(div);
  }
  
  //ここからアラート
  function showAlert(title,txt,popup="hidden",fn=function(){}){
    //タイトル、本文、(デフォルト=10秒閉じ,noClose=自動で閉じないアラート,その他＝confirm),関数ー＞""で囲む,Okayに渡される
    var div1 = document.createElement('div');
    div1.className = "bgAlert";
    var div2 = document.createElement('div');
    div2.className = "alert";
    var h2 = document.createElement('h2');
    h2.innerHTML = title;
    var p = document.createElement('p');
    p.innerHTML = txt;
    // p.style.fontSize = "30px";
    var time = document.createElement('div');
    time.innerHTML = "Auto Close : 100 sec.";
    var cancel = document.createElement('button');
    cancel.innerHTML = "キャンセル";
    cancel.setAttribute("onclick","hideConfirm(this);");
    if(popup==("hidden"))cancel.style.visibility="hidden";
    if(popup==("noClose"))cancel.style.visibility="hidden";
    var okay = document.createElement('button');
    okay.style.background = "#5566FF";
    //
    okay.setAttribute("onclick","hideConfirm(this,"+fn+");");
    okay.innerHTML  = "OK";
    div2.appendChild(h2);
    div2.appendChild(p);
    div2.appendChild(cancel);
    div2.appendChild(okay);
    div1.appendChild(div2);
    document.getElementsByTagName('body')[0].appendChild(div1);
    // console.log();
    if(popup=="hidden"){
      div2.appendChild(time);
      // console.log(time.innerHTML.replace(/[^0-9]/g,""));
      var timeout = setInterval(function(time){time.innerHTML = "Auto Close : "+(parseInt(time.innerHTML.replace(/[^0-9]/g,""))-1)+" sec.";},1000,time);
      setTimeout(function(div1,timeout){clearInterval(timeout);console.log(div1);div1.remove(div1);},101000,div1,timeout);
    }
  }
  function hideConfirm(obj,fc=function(){}){
    obj.parentNode.parentNode.style.display='none';
    // fc();
  }
  