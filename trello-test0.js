/*jslint browser: true */
/*global Trello: true, Promise: true, $: true, alert: true, dust: true, console: true,
         $boards: true, trelloAppKey: true
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
  expiration: "1hour",
  success: onAuthorize
});

$("#connectLink")
  .click(function () {
    Trello.authorize({
      type: "popup",
      expiration: "1hour",
      success: onAuthorize
    });
  });

$("#disconnect").click(logout);

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
