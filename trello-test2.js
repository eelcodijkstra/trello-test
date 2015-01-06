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

function renderBoards(brds) {
  console.log("render boards");
  dust.render("templ1", {boards: brds, title: "boards"}, function (err, out) {
    $("#boards").append(out);
  });
}

function filterFields(key, value) {
  if (key === 'idMemberCreator' || key === 'date' || key === 'id') {
    return undefined;
  } else {
    return value;
  }
}

function filterListMoves(act) {
  return (act.type === "updateCard" && act.data.old !== undefined
      && act.data.old.idList !== undefined);
}

function displayAction(act) {
  var html = $("<li>").append(act.type), str = "";
  if (act.type === "createCard") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName
      + " card.name: " + act.data.card.name
      + " in list: " + act.data.list.name;
    html.append(str);
  } else if (act.type === "createList") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName
      + " list.name: " + act.data.list.name;
    html.append(str);
  } else if (act.type === "createBoard") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName
      + " board.name: " + act.data.board.name;
    html.append(str);
  } else if (act.type === "addToOrganizationBoard") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName
      + " organization.name: " + act.data.organization.name;
    html.append(str);
  } else if (act.type === "updateCard") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName
      + " card.name: " + act.data.card.name;
    if (act.data.old !== undefined && act.data.old.name !== undefined) {
      str = str + " renamed from: " + act.data.old.name;
    } else if (act.data.old !== undefined && act.data.old.idList !== undefined) {
      str = str + " move from list: " + act.data.listBefore.name
        + " to " + act.data.listAfter.name;
    } else if (act.data.old !== undefined && act.data.old.pos !== undefined) {
      str = str + " move from pos: " + act.data.old.pos
        + " to " + act.data.card.pos;
    } else if (act.data.old !== undefined && act.data.old.desc !== undefined) {
      str = str + " desc from: '" + act.data.old.desc + "' to '" + act.data.card.desc + "'";
    } else {
      str = str + " " + JSON.stringify(act, filterFields);
    }
    html.append(str);
  } else if (act.type === "updateList") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName
      + " list.name: " + act.data.list.name;
    if (act.data.old !== undefined && act.data.old.name !== undefined) {
      str = str + " renamed from: " + act.data.old.name;
    } else if (act.data.old !== undefined && act.data.old.pos !== undefined) {
      str = str + " move from pos: " + act.data.old.pos
        + " to " + act.data.list.pos;
    } else {
      str = str + " " + JSON.stringify(act, filterFields);
    }
    html.append(str);
  } else if (act.type === "commentCard") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName;
    str = str + " comment: '" + act.data.text + "'";
    html.append(str);
  } else if (act.type === "addChecklistToCard") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName;
    str = str + " checklist.name: '" + act.data.checklist.name + "'";
    html.append(str);
  } else if (act.type === "addMemberToCard") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName;
    str = str + " card.name: " + act.data.card.name + " member.name: " + act.member.fullName;
    html.append(str);
  } else if (act.type === "addMemberToBoard") {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName;
    str = str + " member.name: " + act.member.fullName + " initials: " + act.member.initials;
    html.append(str);
  } else {
    str = " at: " + act.date + " by: " + act.memberCreator.fullName;
    html.append(" <<<< " + str + " <<<< " + JSON.stringify(act, filterFields));
  }
  return html;
}

function displayActions(actions) {
  var elts = actions.map(displayAction);
  return $("<ul>").append(elts);
}

function displayMoves(actions) {
  var html = $("<ul>"),
    str = "",
    movesBoard = {Backlog: 20, Todo: 0, Doing: 0, Checking: 0, Done: 0},
    moves = actions.filter(filterListMoves);
  moves.sort(function (m0, m1) {
    return Date.parse(m0.date) - Date.parse(m1.date);
  });

  moves.forEach(function (act) {
    movesBoard[act.data.listBefore.name] -= 1;
    movesBoard[act.data.listAfter.name] += 1;
    str = "at: " + act.date
      + " card: " + act.data.card.name
      + " from: " + act.data.listBefore.name
      + " to " + act.data.listAfter.name;
    str = str + " ... " + JSON.stringify(movesBoard);
    $("<li>").append(str).appendTo(html);
  });
  return html;
}

function selectBoard(board) {
  console.log("select: " + board.name);
  promiseGet("boards/" + board.id + "/actions?limit=100")
    .then(function (actions) {
      $("#actions")
        .empty()
        .append(displayActions(actions));
      $("#moves")
        .empty()
        .append(displayMoves(actions));
    });
}

function makeBoardHandlers(boards) {
  boards.forEach(function (board, idx) {
    function handler() {
      selectBoard(board);
    }
    $("#board-" + idx).click(handler);
  });
}

function handleBoards(boards) {
  // alert("boards loaded");
  $boards.empty();
  renderBoards(boards);
  makeBoardHandlers(boards);
  return boards;
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
}

function logout() {
  Trello.deauthorize();
  updateLoggedIn();
}

Trello.setKey(trelloAppKey);

Trello.authorize({
  interactive: false,
  expiration: "1hour",
  name: "IidW test 2",
  success: onAuthorize
});

$("#connectLink")
  .click(function () {
    Trello.authorize({
      type: "popup",
      name: "IidW test 2",
      expiration: "1hour",
      success: onAuthorize
    });
  });

$("#disconnect").click(logout);

var templ1 = '<ul>{~n}{#boards}'
    + '<li class="selectboard"><a href="{url}" target="trello">{$idx} - {name}</a>'
    + '<span id="board-{$idx}">  {name}</span></li>{~n}'
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
