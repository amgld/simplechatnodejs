/**
 *  ПРОСТОЙ ЧАТ С ПОДДЕРЖКОЙ ФОРМУЛ TEX
 *  v. 1.1.0 20.02.2019
 * 
 *  Однооконный чат с хранением данных только в оперативной памяти
 *  сервера без использования каких бы то ни было баз данных или файлов.
 *  Более подробную инструкцию см. в файле README.md
 * 
 *  Copyright © А. М. Гольдин, 2017–2019. a@goldin.su
 *  Лицензия MIT http://licenseit.ru/wiki/index.php/MIT_License
 */
"use strict";

// Настройки чата
const PORT     = 8080;
const MVOL     = 25; // количество показываемых сообщений
const SERVNAME = "MyServer";

var http = require("http");
var url  = require("url");
var fs   = require("fs");

// Функция генерирует цвет по строке (например, по ФИО юзера)
function colorGen (str) {
   const toHex = s => (s + 1).toString(16);
   let color = 0;
   for (let i=0; i<str.length; i++) color = (color + str.charCodeAt(i)) % 1000;
   let colB = color % 10;
   let colG = ((color - colB) / 10) % 10;
   let colR = (color - colB - (10 * colG)) / 100;
   return `#${toHex(colR)}${toHex(colG)}${toHex(colB)}`;
}

// Предварительная подготовка текста поста
function postObrab (p) {
   const smiles = {
      ":)" : "&#128578;", ":-)" : "&#128578;", ":D" : "&#128515;",
      ":(" : "&#128577;", ":-(" : "&#128577;", ";)" : "&#128521;",
      ";-)" : "&#128521;", ":-*" : "&#128536;"};
   p = p.replace(/\r/g, '').replace(/\n{2,}/g, '\n')
        .replace(/<[^>]+?>/gi, '') // вырезание html-тегов
        .replace(/ -- /g, "&nbsp;— ").replace(/\\/g, "%5C")
        .replace(/\[\[(.*?)\]\]/g,
           "<img src=\"http://tex.s2cms.ru/svg/$1\" align=absmiddle>")
        .replace(/\(\((.*?)\)\)/g, "<a href=\"//$1\" target=\"_blank\">$1</a>")   
        .replace(/\n/g, "<br>");
   for (let sm in smiles) {
      let smEkr = sm.replace(')', '\\)').replace('(', '\\(').replace('*', '\\*');
      p = p.replace(new RegExp(smEkr, 'g'), smiles[sm]);
   }
   return p;
}

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

// Читаем шаблон файла справки, отдаваемого клиенту
let help = fs.readFileSync(__dirname + "/help.html", "utf8");

// Создаем стек для записи последних MVOL сообщений
let stack = [];

// Callback обработки запроса
function obrabotka(zapros, otvet) {
   
   otvet.setHeader("Server", SERVNAME);

   // Определяем QUERY STRING (там пришел пароль, либо пароль^,
   // либо help, тогда это запрос на справку)
   let qstr = url.parse(zapros.url).search;
   if (!qstr) qstr = '';
   qstr = qstr.replace("?", "");

   // Определяем фио юзера по его паролю; если пароль неверен, отказываем
   let pwQS = qstr.replace('^', '');
   let tpl = tplCommon;
   if (passws[pwQS] || pwQS == "help") tpl = tpl.replace("{{userFIO}}", passws[pwQS]);
   else {
      otvet.writeHead(403, {"Content-Type": "text/html"});
      otvet.write("<h1>403 Forbidden</h1>");
      otvet.end();
      return 0;
   }

   // Если в querystring help, отдаем html-файл помощи
   if (qstr == "help") {
      otvet.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
      otvet.write(help);
   }
      
   // Если в querystring нет ^, отдаем html-файл из шаблона
   else if (qstr.indexOf("^") == -1) {
      otvet.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
      otvet.write(tpl);
   } else {
      if (zapros.method == "POST") { // если пришел пост
         zapros.on("data", function(dannye) {
            let post = postObrab(dannye.toString().substr(0, 1024));
            // Если пришло три крышки ^^^, очищаем стек
            if (post == "^^^") stack = [];
            // Кладем в стек полученный пост, если он не пуст
            else if (post) {
               let dt       = new Date();
               let dtMes    = dt.getMonth()+1; if (dtMes<10) dtMes='0'+dtMes;
               let dtDen    = dt.getDate();    if (dtDen<10) dtDen='0'+dtDen;
               let dtCha    = dt.getHours();   if (dtCha<10) dtCha='0'+dtCha;
               let dtMin    = dt.getMinutes(); if (dtMin<10) dtMin='0'+dtMin;
               let dtTim    = `${dtDen}.${dtMes} ${dtCha}:${dtMin}`;
               let postForm = `<p><span style="color:#800">${dtTim} `
                            + `<b style="color:${colorGen(passws[pwQS])}">`
                            + `${passws[pwQS]}</b></span><br>${post}</p>`;
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
