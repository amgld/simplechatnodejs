<!DOCTYPE html>
<html>
<head>
<meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
<meta name='viewport' content='width=device-width,
      initial-scale=1.0, maximum-scale=1.0, user-scalable=no'>
<title>Чат</title>
<style>
body {
  background:#efe; font:11pt Tahoma,Arial,sans-serif;
  max-width:750px; margin:auto; position:relative;}
div.hd {
  margin:auto; padding:5px; background:#090;
  color:white; text-align:center; font-size:14pt;}
div.help {
  font-size:14pt; position:absolute; top:5px; left:10px;}
div.help a {
  text-decoration:none; padding:2px; background:white; color:#090;}
div.help a:hover {
  cursor:pointer;}
div.ms {
  padding:5px;}
table.npTable {
  padding:5px; width:100%;}
td.buttSend {
  padding:0px 5px 12px 5px; vertical-align:bottom;}
input.sf {
  width:16em; font-size:11pt; color:white;}
textarea.np {
  width:98%; padding:5px; padding-bottom:2ex; border-radius:5px;
  resize:none; font:11pt Tahoma,Arial,sans-serif; border:1px solid #090;}
textarea.np:focus {
  outline: none;}
button {
  border-radius:5px; margin-left:3px;}
p {
  padding:3pt 0px 3pt 0px; margin:0px;}
</style>
<script>
// Пароль, введенный в адресной строке браузера
pwd = location.search.slice(1);

// Автоматическое изменение количества строк в форме textarea
function textar() {
   var txtAr = document.getElementById('newPost');
   if (txtAr.scrollHeight > txtAr.clientHeight) txtAr.rows++;
}
// Отправка сообщения
function putBeseda() {
   // Получение данных из формы
   var newMss = document.getElementById('newPost').value;
   document.getElementById('newPost').value = '';
   document.getElementById('newPost').rows = 1;

   // Публикуем информацию об отправке сообщения
   var txtBs = document.getElementById('bes');
   bseda = '<p><small>Ваше сообщение отправляется...</small></p>' +
           txtBs.innerHTML;
   txtBs.innerHTML = bseda;

   // Асинхронный ajax к серверу
   var zaprs = new XMLHttpRequest();
   zaprs.abort();
   zaprs.open('POST', '?'+pwd+'^', true);
   zaprs.onreadystatechange = function() {
      if (zaprs.readyState == 4)
         if(zaprs.status == 200) zaprs.abort();
   };
   zaprs.setRequestHeader('Content-Type', 'text-plain');
   zaprs.send(newMss);
   newPost.focus();
}
// Получение текста беседы с сервера
function getBeseda() {
   var zapros = new XMLHttpRequest();
   zapros.abort();
   zapros.open('GET', '?'+pwd+'^', true);
   zapros.onreadystatechange = function() {
      if (zapros.readyState == 4)
         if(zapros.status == 200) {
            beseda = zapros.responseText;
            var txtBes = document.getElementById('bes');
            txtBes.innerHTML = beseda;            
         }
   };
   if (!document.hidden) zapros.send(null);
   setTimeout(getBeseda, 3000);
}
</script>
</head>
<body onLoad='getBeseda();'>

<!-- Заголовочная строка -->
<div class=hd>{{userFIO}}</div>

<!-- Ссылка на файл помощи -->
<div class=help><a href="?help" target="_blank">&#10067;</a></div>

<!-- Форма добавления нового сообщения -->
<table class='npTable' cellspacing=0px>
<tr>
<td width=100%>
  <textarea id='newPost' class='np' rows=1 autofocus
    maxlength=2000 onKeyUp='textar()' onKeyDown='
    if (event.keyCode==13 && event.ctrlKey) putBeseda();'
  ></textarea>
</td>
<td class='buttSend'>
  <button onClick='putBeseda();'><b>&gt;&gt;</b></button>
</td>
</tr>
<table>

<!-- Беседа -->
<div id='bes' class='ms'></div>

</body>
</html>
