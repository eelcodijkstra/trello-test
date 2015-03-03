## Log

See also [Trello board](https://trello.com/b/mBNrJr4l/trello-interface)

### 19-dec-2014

* first working version from jsfiddle example, see: http://jsfiddle.net/nNesx/
* API documentation: https://trello.com/docs/index.html
* get developer key: 
    * first, log in to Trello
    * then: https://trello.com/1/appKey/generate
    * key is in the first box
    
### 20-dec-2014

* drawing of "classes" (in OmniGraffle)
* working version with both cards (owned by "me") and boards (owned by "me").
    * cards and boards link to their Trello counterpart.
    
### 21-dec-2014

* the lists request does not provide extra information: the same information about the lists is also provided in the board request.

### 22-dec-2014

* the asynchrounous requests are not completely handled before we start the rendering. Then, this rendering may be incomplete. (I was missing a number of lists in the rendering, while these were present in the variable `boardMap`.)
    * this problem has been solved: the local list is promises should be returned as part of the global list of promises (l. 92: `return listSeq;`).
    * this makes another problem clear: handling the request in a pure sequential way leaves the user waiting. We should use some of the tricks described in the HTML5-rocks article.
    * http://www.html5rocks.com/en/tutorials/es6/promises/#toc-parallelism-sequencing
    
### 24-dec-2014

* boards, lists, and cards - displaying correctly
* using promises
* using dust templates
* marking own cards

### 27-dec-2014

* obtain description of board from "About" card;
* obtain reference to original board from "Original" link in "About" card description;
    * this is a (short) URL, not a board ID. In the API, we need the board ID, not the short URL. How do we make the transition?

### 28-dec-2014

* progression board in its first version working (incl. color coding...)
* 

### 29-dec-2014

* general clean-up
* start with local storage and retrieval.

### 30-dec-2014

* [x] working: save and restore of `trelloObjects`
    * to be refined with: check for needed update; off-line working?
* [ ] MediaWiki widget for Trello, and/or own application
* [ ] study other Trello applications
* [x] comments on cards
    * we may fetch the actions for a card (or for a board);
    * these actions have a type (`type`) and data (`data`).
    * e.g., `type===commentCard` has data-field `text` (and board, card, list, date, id, memberCreator).
    * e.g., `type===updateCard` has data-fields listBefore and listAfter. (moving a card).
    * in the case of updateCard, the `old` object contains the field(s) that have been updated. This could be the `name` (rename card), `idList` (move card to another list), `pos` (move inside the list), etc.
    
* It would be nice to get the actions of a specific card: this makes sense when inspecting the progress view. E.g., what is the comment of the card most recently updated?
* But, it also makes sense to know what the most recent updates are to a board. What cards have been moved, etc.?
  
Restoring boards etc. is trickier than anticipated: we need to read a board to find out whether its cards and lists have been changed. If not, then this new board should not be used any longer - since it does not contain the extra fields for `xcards` etc. But, this new board value will be used in function results, promises, etc - if we are not very careful...

### 31-dec-2014

* [ ] admin of board: `board.memberships[x].memberType === "admin"` (`idMember` gives the actual member; `id` is the identification of the membership?).
    * a board must have at least one admin; but, there may be more members with admin status?
* [ ] organization of a board: even when a board belongs to an organization, it may be private - i.e., only accessible to the members attached to the board.
    * for the modules case, this seems OK: the student and its teacher(s) are members, the student as admin; the board then belongs to the boards of the teacher.

### 2-jan-2015

* note: for use of the application, we do not need an extensive set of authorizations: when a teacher is member of the boards of its students, he has access to these boards. Thus, the application needs only the authorization of the teacher, not of the students, to access the student-boards.
    * this makes it possible to have a stateless application (only using caching).
* note: members do not change very often; we may get new members, and additional information about the members.
    * does a member record have a timestamp?
    * we may have a function that retrieves the information of a member given its id; this function may use local information, if available; and it may perform a GET, when this local information is not available.
* note: we may need a special button to remove all local information, forcing a refresh. 
* note: when using Dust, we may only reference JSON-like structures; i.e., we cannot use functions. This implies that we cannot use a function to access a field, in order to have some form of lazy evaluation. (We might achieve this by using a GETter-function, but that is not my first step.)

A solution in the form of a function like `organizationFromId`, used to access the organization by means of laxy evaluation, will not work in combination with asynchronous handling of AJAX interactions (i.e., the GET that we need).

### 3-jan-2015

* new test program: trello-test2. Goal: use of actions to get a time-view of a single board, and of a set of boards.
* proposed approach to save/restore and model/view (elaborate in trello-test1):
    * rendering is only done on *complete models*, i.e., models that contain all the data and the extra fields (invariants).
    * general structure: `promiseGetModel(...).then(renderView)`
    * for an update of the data: `promiseUpdateModel(...).then(renderView)`
    * both in the `get` and in the `update`, we may use the locally cached data, in order to reduce the number of AJAX-requests to Trello.
* when we find that a board has been changed, we replace the local copy with the new board - and make this board empty (`xcards = []; xlists = [];`. This will later enforce fetching the lists and cards.
    * we could also remove the cards and the lists from the local copy. - P.M.
    * it might be better to have a field for each board: `xdateLastFetched` or similar.
* *difficult to find problem*: when using `JSON.stringify` with a cyclic datastructure, this may result in some action taking infinite time - the expected progress does not take place, but there is also no error message.
    
* *now working*: test-2, with interpretation of actions and the action-fields.    
* *note*: in some cases, the `createBoard` action is not the first action in the list. How accurate is the time-information of Trello?

### 4-jan-2015

* working: a filtered list of actions: only the card moves
    * this is primarily for module planning; fixed set of tasks, fixed set of lists
    * for other Scrum planning, we need also the creation of cards (in a list)
    * in all cases: fixed set of lists is assumed (Scrum-lists)
    * refinement: labeling ("stuck" etc.)
  
### 5-jan-2015

* trello app-key in separate file: preparing for public version in GitHub

What is needed for first demo-version of the different tests?

* [x] trello-test0: publish (e.g., in Google Drive)
* [ ] trello-test1: better presentation of original boards and derived boards; selection of original board;
    * [x] first step: table-representation of board list.
* [ ] trello-test2:
* [x] public version on GitHub

### 6-jan-2015

* trello-test2: 
    * [x] add board-counters in move-list; reverse order of move-list (sort);
    * [ ] copy board: get board counters from original board.
* trello boards etc. in iframe (e.g., in a MW widget):
    * this can only be done for public boards - which makes it less relevant for our case
    * see e.g. http://jsfiddle.net/danlec/hmQJP/

### 7-jan-2015

* trello-test2:
    * counting number of cards in lists.
    
Question: we do not want to count all elements in a list; currently, we filter only the "module" task cards, "Les..." and "Opdracht...".

An alternative is to filter only the "About..." (and "Meta..."?) cards.

### 8-jan-2015

* trello-test2:
    * first version of board configurations in time - based on card moves
    * includes initial configuration, from `copyBoard` (configuration from template board).
    
### 10-jan-2015

* trello-test3:
    * first version of stacked histogram, with time basis (D3js)
    
Next step(s):

* construct histogram-data from board-data
    * bin per time-period, from status before, and actions inside the bin
    * flexible time-periods
    
### 3-mar-2015

* trello-test1: caching no OK: old data not replaced by recent changes.
    
#### CSS Lint issues

CSS Lint complains about the use of IDs as selectors. I do not know of a global setting
for this option, but this works, when mentioned in the heading of the css-file:

```css
/*csslint ids: false */
```

There should be no spaces between `/*`  and `csslint`.

## ToDo

* [ ] store user token (first in localStorage)
* [x] store multiple user tokens (in localStorage)
    * not necessary: access via board membership.
* [ ] internal mapping between id and object (and v.v.)
* [x] local cache, using update-times of boards (etc.)
* [ ] develop a way of working for modules in Trello, and its display (for students and for teachers).
* [ ] possibility to refresh the board-listing with re-selecting.
* [ ] use of labels to mark cards (e.g., when stuck)
* [x] find admin-member of board; indicate in special column (in general: student)

## Scenario's

For our modules, we want to check the progress of a set of students.

* For each student, there is a board with all modules and projects.
* In this board, the "doing" list presents the active modules and projects
* 

For a specific module, we want to know the progress of the students (working on this module).

* how do we know what students are working on a specific module?
* 

A board may be a specific instance (copy) of another board. How do we know the "mother" board? How do we know from the motherboard, what the derived boards are?

We use the "mother board" to know what tasks are to be done, in what order: this determines the layout of the progress display.

### Scenario: module

In the case of a module, there is a template that describes the tasks to be done. It may also describe the order in which these tasks should (?) be done.

As a refinement, we may also consider a checklist to be part of a task; this may serve to indicate the progress of a task (but, only to a limited degree).

In order to check the progress of the students working on a module, the teacher needs to have access to the boards of the students. This then also provides our application access to these boards. The teacher then is a member of the students' boards.

* how does the application know which boards of a teacher are linked to a specific module?
* a teacher may have access to a few hundred boards. It is not feasible to access all these boards/all the corresponding cards.
* by adding a teacher as "member" to a card, a student may indicate the need for interaction with the teacher on a subject: e.g., when stuck, when needing feedback, or when claiming a badge.


#### Construct template board from spreadsheet

Making a template board can be a significant effort. A lot of the information of a template board in on the back side of the cards: this information is only visible when checking each card separately.

We propose therefor to construct a template board from a spreadsheet. It is much easier to have an overview over all elements in a spreadsheet, where everything is visible. It is also much easier to shuffle information around, e.g., change the order of some parts of the material.

In order to construct a template board from a spreadsheet, we must use a number of conventions.

(Note: the inverse, constructing a spreadsheet from a board, also makes sense: it may help to get an overview over the total board, in a way that is not possible in Trello.)

## Questions

* [x] does a board have a description? If so, where to find this? (According to the API, a board has a description, but I cannot find it in the GUI.)
    * see: http://help.trello.com/article/775-changing-a-boards-title-and-description
    * board descriptions are being phased out. Suggested work-around: add a special card to the board containing the description.
    * for this goal, we introduce a special card "About".
* [ ] should boards have an "archived" list, for cards that are "done" (for a long time)?
* [ ] boards and cards have URLs; does a list have a URL? (Until now, I cannot find this: neither in the GUI, nor in the API description. A list, however, does have an id, and it can be queried as a collection.)
* [ ] what is the meaning of `pos` as attribute of a list? This is not the position of the list in its board; this position is given by the sequence obtained from the board itself.
* [ ] what is the meaning of `pos` as attribute of a card? (The position of a card in its list is given by the array of cards. (Note: this array is the result of a request.)
* [ ] does the API expose the comments on the boards?
* [ ] how dow we make a comma-separated list with dust?
* [ ] do we need the student-boards to be part of the ICTidW organization? Or is membership of a teacher sufficient (for access)?

### Templates

I'm trying to use dust templates - but, for the time being, nested arrays seem not to have a simple solution. (The newer version of dust, as provided by LinkedIn, may offer a solution to this.)

* [demo of updated version](http://linkedin.github.com/dustjs/test/test.html)
* [tutorial](https://github.com/linkedin/dustjs/wiki/Dust-Tutorial)

### General approach: data model and view(s)

For this application, it makes sense to separate the data model and the views on this model: there are many different views possible, and the queries for these views may better be done on the local data model, instead of directly on the Trello data.

Part of this approach may be to store the data model in some local storage, and to synchronize this local data only when needed. E.g., for boards, these is an indication when the last action took place on the board: this implies also the last action on any of its cards. (Field: `dateLastActivity`; a date/time string.)

The data may be stored in `localStorage`. For this, we can use the same representation as used in the API: instead of object links, use object IDs (e.g., idBoard). For the reconstruction of the internat data structures, we then may use `trelloObject`, mapping extermal IDs on local objects.

> Note: we then must guarantee that there are no two objects with the same id: when creating an object, we must take care that this invariant is kept.

> Note: it is possible better to query for all cards of a board at the same time, instead of querying the cards for each list. We may use the `idList` of a card to identify its status. Note that we also may select what fields we need; these is quite some redundancy in these fields.

1. get member information (me)
2. get all organization members
3. get all boards
4. get all lists (only for boards that have been changed since last retrieve)
5. get all cards (only for boards that have been changed since last retrieve)
5. 

> Not all boards do have an organization; for some (personal) boards, idOrganization===0.

If we retrieve the cards per board, and not per list, we do not necessarily know the order of the cards in a list; or, does this follow from the `pos` field? (this is not a simple ordinal number... perhaps to make reordering easier?)

### Remarks

The kind of development I use is based on small steps, that result in some form of test. However, it is not the kind of repeatable test that I would like to seen. In many cases, the result of the test is some temporary `alert` or `console.log`. One of the reasons for this is that the test results are very internal, and not easily exposed as external test.

We could define the original of a board to be the board itself - unless otherwise noted. In this way, we can always define this field as a valid board.

When adding an element (Lesson) to a mother-board, this may present problems for derived boards. We need to take care of that situation. (In the progress board, this may result in a card not being defined for a specific column.) (*Solution:* empty element in the progress board.)

When adding an element to a derived board, this will not be present in the progress board. Do we need a solution for this?

For most views, we follow the organization of the data (model): an organization has boards (and members); a board has lists and cards - either can be the starting point for a view. But, for the progress view, we need another organization: the horizontal order is determined by the order of the cards in the mother-board.

What is the best way to get the relevant information of a board:

* the board itself: name, id, shortUrl, (xcards, xlists) 
* the cards: name, id, idList, idMembers, shortUrl, (xboard, xlist)
* the lists: name, id (xcards)

A card can only be element of a single list: it makes more sense to have a link from card to list, than vice versa. Getting the cards via the boards gives the least requests.

And:

* the organizations: name, id, shortUrl
* the members: name, id, fullName, shortUrl,

References between boards, cards, and lists:

* we need to *avoid cyclic references*; this is a problem when using JSON.stringify (e.g., for displaying a value).
    * a possible solution may be to use a replacement-function for this display.
*it is easier to have the reference from a card to its list and board, than vice versa: a list and a board contain multiple cards.
* we cannot reconstruct the cards of a board from the board-information: we get the cards as result of a GET-request, and we only may reconstruct the cards of a board from the information in the cards (`idBoard`). Btw., the order of the cards of a board is not relevant: the order of the lists is relevant, and the order of the cards in the list is relevant.
* board: `xcards` and `xlists` (in the right order); list: `xcards` (in the right order) - but, this is only constructed when we query the cards for eacht list...
    * `idList(s)` is not a board-field... (i.e., we cannot reconstruct the lists from the board, only thr other way around; order of the lists in the board???)
* we may need to keep the position of a list in its board in an x-var; similar, the position of a card in its board (and in its list?).
* it is relatively safe to use such a redundant representation, since we do not have selective updates: the only update we consider is a total replacement by data from the server.


**Proposed solution**:

* only the references from top to bottom (from board to lists, from board to cards, and from list to cards) are preserved in displays and in storage;
* backlinks - from card to board, and to list - are present in the version in memory, but are replaced by a special function that is used for `JSON.stringify`.
* when reading the objects from storage, we need to reconstruct the back-links. A single traversal of the cards and lists is sufficient for this;
* a similar action is necessary when GETting the cards and lists from the server.


## API

The description of the API is rather limited: the names of fields in the result are described. The meaning and the data formats need to be found out in an experimental way.

### Action

The information in actions is only very superficially described in the API documentation. The following fields are described in the API:


Based on experiments with the API, we find the following:

* an action may influence a card, a list and/or a board.
* the `data` field contains the fields that got a new value.
* the `old` field contains the old values for these fields.

The information in the actions of a board is quite complete: it allows for a complete reconstruction of the history of a board. This means that an historic overview, e.g., of the burndown rate of a project, is possible based on the action information.

> This is another approach than taken by XXX: in that case, a regular sampling of the board takes place.


## Conventions

* the description of a board is given by the description (`desc`) of a card named `About`.
    * Trello does not have an option to add a description to a board; this use of a special card aims to address this.
    * Usually, this card is the first card on a board: first position in the first column. For the software, only the name of the card is relevant, not its position.
* the description of a board (on the card `About`) may contain a link to the original board, from which this board is copied ("Copy Board"). This link is represented as a Markdown link, with `Original` as label: `[Original](...url of original board...)`.
    * the description of a board is in Markdown notation, similar to comments etc. on a card.
* for the *module boards*, we use some special conventions:
    * the template for the module is given by a special board;
    * a student board is a copy of this template board (Copy Board);
    * the `Original` link of a student board is made to refer to the module template;
    * the module template board contains the lessons and tasks to be done as part of the module;
    * the lessons and tasks are given by cards with names starting with `Les` or `Opdracht`.
    * in the template, these cards should be placed in the list `Backlog`, the other lists must be empty.

## Other work

* http://kevinpelgrims.com/blog/2012/03/06/project-progress-tracking-with-google-docs-and-trello
* http://www.littlebluemonkey.com/blog/add-enhanced-workflow-to-trello
* http://www.littlebluemonkey.com/blog/pimp-your-trello-cards/
* http://handsontable.com/index.html
* https://github.com/markdrago/cardorizer
* https://docs.google.com/a/ictindewolken.nl/spreadsheet/ccc?key=0AoWf_Tca5KDudHY2emk0Xy1FZEtKLW5TekhJUE5zSHc&pli=1#gid=0

### Promises

* http://www.html5rocks.com/en/tutorials/es6/promises/#toc-parallelism-sequencing

### Templates

* dust: http://linkedin.github.io/dustjs/test/test.html


### Visualization

* http://code.shutterstock.com/rickshaw/
* d3.js
   * https://github.com/mbostock/d3/wiki/Time
   * http://bl.ocks.org/mbostock/3886208 (stacked bar chart)
   * http://bl.ocks.org/mbostock/3886394 (normalized stacked bar chart)
   * http://bl.ocks.org/mbostock/5977197 (DRY bar chart)
* http://bl.ocks.org/mbostock/4060954 (stream graphs)
     https://github.com/mbostock/d3/wiki/Stack-Layout
* http://bl.ocks.org/mbostock/3943967 (stacked bars)
* http://bl.ocks.org/mbostock/4062085 (population pyramid)
* http://metricsgraphicsjs.org/examples.htm (for time series)

d3.js: see basic techniques

### On Google Drive

* [trello-test0](https://googledrive.com/host/0B4Wf_Tca5KDuSm02bkFqaWJnZWM/trello-test0.html)
