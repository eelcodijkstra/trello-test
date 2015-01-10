/*jslint browser: true */
/*global Trello: true, Promise: true, $: true, alert: true, dust: true, console: true,
         $boards: true, trelloAppKey: true, d3: true
*/

/*
NOTE: To include the Trello client library in your own code, you would include jQuery and
then
  <script src="https://api.trello.com/1/client.js?key=your_application_key">...
See https://trello.com/docs for a list of available API URLs
The API development board is at https://trello.com/api
*/

var boardMap = [];
var trelloObjects = {};
var me;
var $boards;

var data = [
    {date: "2015-01-05T12:32:06.421Z", board: [12, 0, 0, 0, 0]},
    {date: "2015-01-06T12:32:06.421Z", board: [11, 1, 0, 0, 0]},
    {date: "2015-01-07T12:32:06.421Z", board: [10, 1, 1, 0, 0]},
    {date: "2015-01-08T12:32:06.421Z", board: [ 9, 1, 1, 1, 0]},
    {date: "2015-01-09T12:32:06.421Z", board: [ 8, 1, 1, 1, 1]},
    {date: "2015-01-10T12:32:06.421Z", board: [ 6, 2, 1, 1, 2]},
    {date: "2015-01-11T12:32:06.421Z", board: [ 4, 2, 2, 2, 2]}
  ];

var listLabels = ["Backlog", "Todo", "Doing", "Checking", "Done"];

function displayBoards() {
  var boardElt;
}

function updateLoggedIn() {
  var isLoggedIn = Trello.authorized();
  $("#loggedout").toggle(!isLoggedIn);
  $("#loggedin").toggle(isLoggedIn);
}

function promiseGet(url) {
  return new Promise(function (resolve, reject) {
    Trello.get(url, resolve, reject);
  });
}

function promiseMembersGet(url) {
  return new Promise(function (resolve, reject) {
    Trello.members.get(url, resolve, reject);
  });
}

function markCards(cards) {
  cards.forEach(function (crd) {
    var mark = false;
    crd.idMembers.forEach(function (idm) {
      if (idm === me.id) {
        mark = true;
      }
    });
    crd.xmark = mark;
  });
}

// get the cards of the lists
// (problem: for what board(s)?) idBoard-field
function getListCards(lists) {
  var proms = lists.map(function (list, inx) {
    return promiseGet("lists/" + list.id + "/cards")
      .then(function (cards) {
        var board;
        if (trelloObjects[list.idBoard]) {
          board = trelloObjects[list.idBoard];
          board.xlists[inx] = list;
        } else {
          board = {name: "???"};
        }
        trelloObjects[list.id] = list;
        list.xcards = cards;
        markCards(cards);
      });
  });
  return Promise.all(proms);
}

function getBoardLists(boards) {
  // alert("getBoardLists");
  var boardProms = boards.map(function (board, inxB) {
    boardMap[inxB] = board;
    board.xlists = [];
    trelloObjects[board.id] = board;

    return promiseGet("boards/" + board.id + "/lists")
      .then(getListCards);
  });

  return Promise.all(boardProms);
}

function renderBoardLists() {
  dust.render("templ1", {boards: boardMap, title: "boards"}, function (err, out) {
    $("#boards").append(out);
  });
  boardMap.forEach(function (elt, idx) {
    dust.render("templ2", {lists: elt.xlists, boardnr: idx}, function (err, out) {
      $("#board-" + idx).append(out);
    });
    elt.xlists.forEach(function (lst, ix) {
      dust.render("templ3", {cards: lst.xcards, boardnr: idx, lstnr: ix}, function (err, out) {
        $("#list-" + idx + "-" + ix).append(out);
      });
    });
  });
}

function handleBoards(boards) {
  // alert("boards loaded");
  $boards.empty();
  return getBoardLists(boards)
    .then(function () {
      // alert("READY");
      renderBoardLists();
    });
}

function getMemberCards(member) {
  var $cards = $("<div>")
      .text("Loading Cards...")
        .appendTo("#output");

    // Output a list of all of the cards that the member
    // is assigned to
  Trello.get("members/me/cards", function (cards) {
    $cards.empty();
    $.each(cards, function (ix, card) {
      $("<a>")
        .attr({href: card.url, target: "trello"})
        .addClass("card")
        .text(card.name + "--" + card.idBoard)
        .appendTo($cards);
    });
  });
}

function onAuthorize() {
  $boards = $("<div>")
    .text("Loading Boards...")
    .appendTo("#boards");
  $('<ul id="boardList">').appendTo("#boards");

  updateLoggedIn();
  $("#output").empty();

  promiseMembersGet("me")
    .then(function (member) {
      me = member;
      trelloObjects[member.id] = member;
      $("#fullName").text(member.fullName);

 //     alert(JSON.stringify(member));
    }).then(function () {
      // alert("get boards");
      return promiseGet("members/me/boards");
    }).then(handleBoards);

  Trello.members.get("me", getMemberCards);
}

function logout() {
  Trello.deauthorize();
  updateLoggedIn();
}

Trello.setKey(trelloAppKey);

Trello.authorize({
  interactive: false,
  name: "ICTidW test 0",
  expiration: "1hour",
  success: onAuthorize
});

$("#connectLink")
  .click(function () {
    Trello.authorize({
      type: "popup",
      name: "ICTidW test 0",
      expiration: "1hour",
      success: onAuthorize
    });
  });

$("#disconnect").click(logout);

var colors = ["blue", "red", "green", "yellow", "steelblue"];

var margin = {top: 20, right: 30, bottom: 30, left: 40},
  width = 600 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

var y = d3.scale.linear()
    .range([height, 0]);

var x = d3.time.scale();
x.domain([new Date(data[0].date), new Date(data[data.length - 1].date) ]);
x.range([0, width + 3]);
//x.ticks(d3.time.hours, 6);
//x.rangeRoundBands([0, width], 1);

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.select(".chart").style("border", "1px solid red");

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

y.domain([0, d3.max(data, function (d) {
  return d3.sum(d.board);
})]);

function trans(a) {
  var res = [],
    sum = 0;
  a.forEach(function (elt) {
    res.push({y0: elt + sum, y1: elt});
    sum += elt;
  });
  return res;
}

var barWidth = width / data.length;

var bar = chart.selectAll("g")
    .data(data)
    .enter().append("g")
    .attr("transform", function (d, i) {
      return "translate(" + (i * barWidth) + ",0)";
    });

bar.selectAll("rect")
  .data(function (d, i) { return trans(d.board); })
  .enter()
  .append("rect")
  .style("fill", function (d, i) {
    return colors[i];
  })
  .attr("y", function (d, i) { return y(d.y0); })
  .attr("height", function (d, i) { return height - y(d.y1); })
  .attr("width", barWidth - 1);

bar.append("text")
    .attr("x", barWidth / 1.4)
    .attr("y", function (d) { return y(d.board[0]) + 3; })
    .attr("dy", ".75em")
    .text(function (d) { return d.board; });

chart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

var templ1 = '<ul>{~n}{#boards}<li><a href="{url}" target="trello">{$idx} - {name}</a></li>{~n}'
    + '<ul id="board-{$idx}"></ul>{~n}'
    + '{/boards}</ul>';
var boardTemplate = dust.compile(templ1, "templ1");
dust.loadSource(boardTemplate);

var templ2 = '{#lists}<li >{name}'
    + '<ul id="list-{boardnr}-{$idx}"> </ul>'
    + '</li>{~n}{/lists}';
var listTemplate = dust.compile(templ2, "templ2");
dust.loadSource(listTemplate);

var templ3 = '{#cards}<li><a href="{url}" target="trello" {?xmark}class="marked"{/xmark}>'
    + '{$idx} - {name}</a></li>{~n}{/cards}';
var cardsTemplate = dust.compile(templ3, "templ3");
dust.loadSource(cardsTemplate);
