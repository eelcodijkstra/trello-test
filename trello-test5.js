/*jslint browser: true, regexp: true */
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

var boardMap = []; // my boards ==> me.xboards
var trelloObjects = {};
var me;
var $boards;
var members = [];

function filterX(key, value) {
  return (key[0] === 'x') ? undefined : value;
}

function cleanup(key, value) {
  if (key[0] === 'x' && key !== 'xtype' && key !== 'xinx') {
    return undefined;
  } else {
    return value;
  }
}

function emptyBoard(brd) {
  return (brd.xcards) ? brd.xcards.length === 0 : true;
}

function changedBoard(brd) {
  //console.log("changed? " + brd.name + " last act: " + brd.dateLastActivity);
  //return localStorage.getItem("saveTime") < new Date(brd.dateLastActivity).valueOf();
  if (trelloObjects[brd.id]) {
    return trelloObjects[brd.id].dateLastActivity !==  brd.dateLastActivity;
  } else {
    return true;
  }
}

function saveObjects() {
  localStorage.setItem("trelloObjects", JSON.stringify(trelloObjects, cleanup));
  localStorage.setItem("saveTime", Date.now());
}

// find board, given short URL
function getBoardFromUrl(url) {
  var result = null;
  boardMap.forEach(function (brd) {
    if (brd.shortUrl === url) {
      result = brd;
    }
  });
  return result;
}

function getOriginal(board) {
  var urlOrig = board.shortUrl,
    rexp = /\[Original\]\(([^)]*)\)/;
  if (board.xabout) {
    var match = rexp.exec(board.xabout.desc);
    if (match && match.length > 1) {
      urlOrig = match[1];
    }
  }
  board.xurlOriginal = urlOrig;
  board.xoriginal = getBoardFromUrl(urlOrig);
  if (board.xoriginal === null) {
    board.xoriginal = board;
  }
  console.log("original of " + board.name + ": " + urlOrig + " - " + board.xoriginal.name);
}

function restoreCard(key) {
  var card = trelloObjects[key];
  if (card.xtype === 'card') {
    card.xboard = trelloObjects[card.idBoard];
    card.xboard.xcards[card.xinx] = card;
    card.xlist = trelloObjects[card.idList];
    if (card.name === "About") {
      card.xboard.xabout = card;
      // set original????
    }
    console.log("Card (" + card.xinx + "-" + card.xlist.name + "): " +
                card.name);
  }
}

function restoreList(key) {
  var list = trelloObjects[key];
  if (list.xtype === 'list') {
    list.xboard = trelloObjects[list.idBoard];
    list.xboard.xlists[list.xinx] = list;
    console.log("List (" + list.xinx + "-" + list.xboard.name + "): " +
                list.name);
  }
}

function restoreBoard(key) {
  var board = trelloObjects[key];
  if (board.xtype === 'board') {
    board.xcards = [];
    board.xlists = [];
    boardMap.push(board);
    console.log("Board: " + board.name);
  }
}

function restoreOrganization(key) {
  var org = trelloObjects[key];
  if (org.xtype === 'organization') {
    console.log("Org: " + org.name);
  }
}

function restoreMember(key) {
  var member = trelloObjects[key];
  if (member.xtype === 'member') {
    console.log("Member: " + member.name);
  }
}

function restoreObjects() {
  var keys;
  trelloObjects = JSON.parse(localStorage.getItem("trelloObjects")) || {};
  boardMap = [];
  keys = Object.keys(trelloObjects);
  keys.forEach(restoreOrganization);
  keys.forEach(restoreMember);
  keys.forEach(restoreBoard);
  keys.forEach(restoreList);
  keys.forEach(restoreCard);
  boardMap.forEach(getOriginal);
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
    crd.xmark = false;
    crd.idMembers.forEach(function (idm) {
      if (idm === me.id) {
        crd.xmark = true;
      }
    });
  });
}

function getAdmin(board) {
  //  board.xadmin = trelloObjects[me.id];
  board.memberships.forEach(function (mship) {
    if (mship.memberType === "admin") {
      board.xadmin = trelloObjects[mship.idMember];
    }
  });
  console.log("board: " + board.name + " admin: " + JSON.stringify(board.xadmin));
}

// we combine lists and cards, to achieve parallelism & sequencing
// returns boards (for composition)
function getListsAndCards(boards) {
  var boardProms = boards.map(function (board, inxB) {
    if (!emptyBoard(board)) {
      console.log(">>>reusing local data: " + board.name);
      return trelloObjects[board.id]; // local copy, with extra fields
    } else {
      return promiseGet("boards/" + board.id + "/lists")
        .then(function (lists) {
          board.xlists = lists;
          lists.forEach(function (list, inx) {
            console.log("list: " + list.name);
            list.xboard = board; // gives cyclic datastructure
            list.xinx = inx;
            list.xtype = 'list';
            trelloObjects[list.id] = list;
          });
        }).then(function () {
          return promiseGet("boards/" + board.id + "/cards")
            .then(function (cards) {
              board.xcards = cards;
              cards.forEach(function (card, inx) {
                card.xtype = 'card';
                if (card.name === "About") {
                  board.xabout = card;
                }
                card.xlist = trelloObjects[card.idList];
                card.xinx = inx;
                console.log("card(" + inx + "-" + card.xlist.name + "): " +
                        card.name + " pos: " + card.pos);
                trelloObjects[card.id] = card;
              });
              getOriginal(board);
              return board;
            });
        });
    }
  });
  return Promise.all(boardProms);
}

function getDerivedBoards(board) {
  return boardMap.filter(function (db) {
    return (db.xoriginal === board) && (db !== board);
  });
}

// results in a display of the board-lists as columns, and
// the derived boards as rows.
function selectBoard(board) {
  board = trelloObjects[board.id]; // @@@@@
  getAdmin(board);
  console.log("select board: " + board.name + "(" + board.xadmin.fullName + ")");
  var displayBoard = [{title: "Board", cards: [board.xabout]}], // organized by column...
    dboards,
    column = {"Board": 0},
    table = $('<table "border="1">'),
    row = $('<td>');

  board.xcards.forEach(function (card) {
    if (card.name.match(/^Les/) || card.name.match(/^Opdracht/)) {
      column[card.name] = displayBoard.length;
      displayBoard.push({title: card.name, cards: [card]});
    }
  });
  // console.log("titles: " + JSON.stringify(displayBoard, filterX));
  dboards = getDerivedBoards(board);
  dboards.forEach(function (db, dbinx) {
    db.xcards.forEach(function (crd) {
      var col = column[crd.name];
      if (col) {
        displayBoard[col].cards[dbinx + 1] = crd;
      }
    });
  });
  // console.log("==>titles: " + JSON.stringify(displayBoard, filterX));
  table = $('<table border="1">');
  row = $('<tr>');
  table.append(row);
  $('<td>')
    .append('<a href="' + board.shortUrl + '" target="trello">' + 'Board</a>')
    .appendTo(row);

  $('<td>')
    .append(board.xadmin.fullName)
    .appendTo(row);

  displayBoard.forEach(function (col, colnr) {
    if (colnr > 0) {
      $('<td>')
        .append('<a href="' + col.cards[0].shortUrl + '" target="trello">' +
                col.cards[0].name + '</a>')
        .appendTo(row);
    }
  });

  dboards.forEach(function (brd, brdinx) {
    getAdmin(brd);
    row = $('<tr>');
    table.append(row);
    $('<td>')
      .append('<a href="' + brd.shortUrl + '" target="trello">' + brd.name + '</a>')
      .appendTo(row);
    $('<td>')
      .append(brd.xadmin.fullName)
      .appendTo(row);
    displayBoard.forEach(function (col, colnr) {
      if (colnr > 0) {
        // console.log('brdinx: ' + brdinx + ' col: ' + colnr + "--" + JSON.stringify(col, filterX));
        var crd = col.cards[brdinx + 1];
        if (crd) {
          $('<td class="' + crd.xlist.name + '">')
            .append('<a href="' + crd.shortUrl + '" target="trello">' +
                    crd.xlist.name + '</a>')
            .appendTo(row);
        } else {
          $('<td></td>').appendTo(row);
        }
      }
    });
  });
  $('#progressTable').empty().append(table);
}

function makeBoardHandlers(boards) {
  boards.forEach(function (board, idx) {
    function handler() {
      selectBoard(board);
    }
    $("#board-" + idx).click(handler);
  });
}

function makeMasterboardHandlers(boards) {
  boards.forEach(function (board, idx) {
    function handler() {
      selectBoard(board);
    }
    $("#masterboard-" + idx).click(handler);
  });
}

function selectTemplate() {
  var idTempl = $("#templselector").val();
  if (idTempl !== "0") {
    var templ = trelloObjects[idTempl];
    selectBoard(templ);
  }
}

function selectOrganization() {
  var idOrg = $("#orgselector").val();
  if (idOrg !== "0") {
    promiseGet("organizations/" + idOrg + "/members")
      .then(function (mbrs) {
        console.log("members: " + JSON.stringify(mbrs));
        members = mbrs;
        members.forEach(function (mbr) {
          trelloObjects[mbr.id] = mbr;
          mbr.xtype = "member";
        });
        return mbrs;
      }).then(function (mbrs) {
        return me.xboards.filter(function (brd) {
          return brd.idOrganization === idOrg;
        });
      }).then(getListsAndCards)
      .then(function (orgBoards) {
        var masterboards = orgBoards.filter(function (brd) {
          return (brd.xoriginal === brd);
        });
        dust.render("templ7", {boards: masterboards}, function (err, out) {
          $("#masterboards").empty();
          $("#masterboards").append(out);
        });
        makeMasterboardHandlers(masterboards);
        saveObjects();
        dust.render("templ5", {templboards: masterboards}, function (err, out) {
          $("#templselector").append(out);
        });
        // alert("boards loaded" + JSON.stringify(boards));
      });
  }
}

function removeCachedCards(cards) {
  cards.forEach(function (crd) {
    delete trelloObjects[crd.id];
  });
}

function removeCachedLists(lists) {
  lists.forEach(function (lst) {
    delete trelloObjects[lst.id];
  });
}

function getBoards(me) {
  return promiseGet("members/me/boards")
    .then(function (boards) {
      var newBoards = boards.map(function (brd, idx) {
        if (trelloObjects[brd.id] === undefined) {
          trelloObjects[brd.id] = brd; // register new board object
          brd.xcards = [];
          brd.xlists = [];
          brd.xtype = 'board';
        } else if (changedBoard(brd)) {
          var oldBoard = trelloObjects[brd.id];
          if (oldBoard.xcards) {
            removeCachedCards(oldBoard.xcards);
            removeCachedLists(oldBoard.xlists);
          }
          trelloObjects[brd.id] = brd; // replace by new board object
          brd.xcards = [];
          brd.xlists = [];
          brd.xtype = 'board';
        }
        me.xboards[idx] = trelloObjects[brd.id];
        return trelloObjects[brd.id];
      });
      return newBoards;
    });
}

function onAuthorize() {
  $boards = $("<div>")
    .text("Loading Boards...")
    .appendTo("#boards");
  $('<ul id="boardList">').appendTo("#boards");

  updateLoggedIn();
  $("#output").empty();

  console.log(">>>Restore:");
  restoreObjects();
  console.log("<<<restored");

  promiseMembersGet("me")
    .then(function (member) {
      member.xtype = 'member';
      trelloObjects[member.id] = member;
      me = member;
      me.xboards = [];
      me.xorgs = [];
      return member;
    }).then(function (myself) {
      var orgGets = myself.idOrganizations.map(function (idOrg) {
        if (trelloObjects[idOrg] !== undefined) {
          console.log("restored: " + trelloObjects[idOrg].name);
          return trelloObjects[idOrg];
        } else {
          return promiseGet("organizations/" + idOrg)
            .then(function (org) {
              org.xtype = "organization";
              trelloObjects[org.id] = org;
              return org;
            });
        }
      });
      return Promise.all(orgGets);
    }).then(function (orgs) {
      me.xorgs = orgs;
      saveObjects();
      // rendering:
      $("#fullName").text(me.fullName);
      console.log("organizations:" + JSON.stringify(orgs));
      dust.render("templ4", {orgs: orgs}, function (err, out) {
        $("#orgselector").append(out);
      });
      return me;
    }).then(getBoards)
    .then(function (brds) {
      boardMap = brds;
      me.xboards = brds;
      $("#boards").empty();
      $("#boards").append("my boards loaded");
    });
}

function logout() {
  Trello.deauthorize();
  $("#orgselector").html('<option value="0"> ...select... </option>');
  updateLoggedIn();
}

Trello.setKey(trelloAppKey);

Trello.authorize({
  interactive: false,
  expiration: "1hour",
  name: "ICTidW-test1",
  success: onAuthorize
});

$("#connectLink")
  .click(function () {
    Trello.authorize({
      type: "popup",
      name: "ICTidW-test1",
      expiration: "1hour",
      success: onAuthorize
    });
  });

$("#disconnect").click(logout);
$("#orgselector").change(selectOrganization);
$("#templselector").change(selectTemplate);

var templ1 = '<ul>{~n}{#boards}<li id="board-{$idx}" class="selectboard">{$idx} - ' +
    '<a href="{url}" target="trello">{name}</a>' +
    ' - Original: {xoriginal.name}</li>{~n}' +
    '{/boards}</ul>';
var boardTemplate = dust.compile(templ1, "templ1");
dust.loadSource(boardTemplate);

var templ2 = '{#lists}<li >{name}' +
    '<ul id="list-{boardnr}-{$idx}"> </ul>' +
    '</li>{~n}{/lists}';
var listTemplate = dust.compile(templ2, "templ2");
dust.loadSource(listTemplate);

var templ3 = '{#cards}<li><a href="{url}" target="trello" {?xmark}class="marked"{/xmark}>' +
    '{$idx} - {name}</a></li>{~n}{/cards}';
var cardsTemplate = dust.compile(templ3, "templ3");
dust.loadSource(cardsTemplate);

var templ4 = '{#orgs}<option value="{id}">' +
    '{displayName} ({name})' +
    '</option>{~n}{/orgs}';
dust.loadSource(dust.compile(templ4, "templ4"));

var templ5 = '{#templboards}<option value="{id}">' +
    '{name}' +
    '</option>{~n}{/templboards}';
dust.loadSource(dust.compile(templ5, "templ5"));

var templ6 = '<table style="border: 1px solid blue;"><thead><tr><td></td><td>Board</td><td>Original</td</tr></thead>{~n}' +
    '{#boards}<tr ><td>{$idx}</td>' +
    '<td><a href="{url}" target="trello">{name}</a></td>' +
    '<td id="board-{$idx}" class="selectboard">{xoriginal.name}</td></tr>{~n}' +
    '{/boards}</table>';
dust.loadSource(dust.compile(templ6, "templ6"));

var templ7 = '<table style="border: 1px solid red;"><thead><tr><td></td><td>Board</td><td>Original</td</tr></thead>{~n}' +
    '{#boards}<tr ><td>{$idx}</td>' +
    '<td><a href="{url}" target="trello">{name}</a></td>' +
    '<td id="masterboard-{$idx}" class="selectboard">{xoriginal.name}</td></tr>{~n}' +
    '{/boards}</table>';
dust.loadSource(dust.compile(templ7, "templ7"));
