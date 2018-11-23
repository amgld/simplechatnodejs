/**
 *  ПРОСТОЙ ЧАТ
 * 
 *  Однооконный чат с хранением данных только в оперативной памяти
 *  сервера без использования каких бы то ни было баз данных или файлов.
 *  Более подробную инструкцию см. в файле readme.txt
 * 
 *  © Александр Гольдин, 2017
 */
"use strict";

// Настройки чата
const PORT     = 8080;
const MVOL     = 25; // количество показываемых сообщений

var http = require("http");
var url  = require("url");
var fs   = require("fs");

// Разбираем файл с паролями (строка вида pass^Вася Иванов)
// в массив passws[пароль] = "Вася Иванов"
let passws = {};
let pswStr = fs.readFileSync(__dirname + "/sam.dat", "utf8");
let pswArr = pswStr.replace(/\r/g, '').replace(/\n+/g, '\n').trim().split('\n');
for (let p of pswArr) {
   let pwArr = p.split("^");
   passws[String(pwArr[0])] = pwArr[1];
}

// Читаем шаблон html-файла, отдаваемого клиенту
let tplCommon = fs.readFileSync(__dirname + "/klient.tpl", "utf8");

// Создаем стек для записи последних MVOL сообщений
let stack = [];

// Callback обработки запроса
function obrabotka(zapros, otvet) {
   
   otvet.setHeader("Server", "Yaws 2.0.4");

   // Определяем QUERY STRING (там пришел пароль либо пароль^)
   let qstr = url.parse(zapros.url).search;
   if (!qstr) qstr = '';
   qstr = qstr.replace("?", "");

   // Определяем фио юзера по его паролю; если пароль неверен, отказываем
   let pwQS = qstr.replace('^', '');
   let tpl = tplCommon;
   if (passws[pwQS]) tpl = tpl.replace("{{userFIO}}", passws[pwQS]);
   else {
      otvet.writeHead(403, {"Content-Type": "text/html"});
      otvet.write("<h1>403 Forbidden</h1>");
      otvet.end();
      return 0;
   }

   // Если в querystring нет ^, отдаем html-файл из шаблона
   if (qstr.indexOf("^") == -1) {
      otvet.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
      otvet.write(tpl);
   } else {
      if (zapros.method == "POST") { // если пришел пост
         zapros.on("data", function(dannye) {
            let post = dannye.toString().substr(0, 1024);
            post = post.replace(/\r/g, '').replace(/\n{2,}/g, "\n\n").trim();
            // Кладем в стек полученный пост, если он не пуст
            if (post) {
               let dt       = new Date();
               let dtMes    = dt.getMonth()+1; if (dtMes<10) dtMes='0'+dtMes;
               let dtDen    = dt.getDate();    if (dtDen<10) dtDen='0'+dtDen;
               let dtCha    = dt.getHours();   if (dtCha<10) dtCha='0'+dtCha;
               let dtMin    = dt.getMinutes(); if (dtMin<10) dtMin='0'+dtMin;
               let dtTim    = `${dtDen}.${dtMes} ${dtCha}:${dtMin}`;
               let postForm = `<p><span style="color:#800">${dtTim} `
                            + `<b>${passws[pwQS]}</b></span><br>${post}</p>`;
               stack.push(postForm);
            }
            // Если длина получилась больше MVOL, удаляем дно стека
            let x;
            if (stack.length > MVOL) x = stack.shift();
         });
      }
      // В любом случае читаем из стека и отдаем
      let content = '';
      for (let k = stack.length - 1; k > -1; k--) content += stack[k];
      content = content.replace(/\n/g, "<br>");
      otvet.writeHead(200, {"Content-Type": "text/plain; charset=UTF-8"});
      otvet.write(content);
   }
   otvet.end();
}

// Стартуем...
http.createServer(obrabotka).listen(PORT);
console.log("Chat is started on port " + PORT);
