
function ajaxGet(url) {
  return Rx.Observable.create(function (observable) {
    var xhr = new XMLHttpRequest()
    xhr.open('get', url)
    xhr.responseType = 'json'
    xhr.addEventListener('error', function (error) {
      observable.onError(error)
      observable.onCompleted()
    })
    xhr.addEventListener('load', function (error) {
      observable.onNext(xhr.response)
      observable.onCompleted()
    })
    xhr.send()
  })
}

function getRandomUser(click, listUsers) {
    return listUsers[Math.floor(Math.random()*listUsers.length)];
}

function createSuggestionStream(closeClickStream) {
    return closeClickStream.startWith('startup click')
        .combineLatest(responseStream, getRandomUser)
        .merge(refreshClickStream.map(function(){ 
            return null;
        }))
        .startWith(null);
}

var refreshButton = document.querySelector('.refresh');
var closeButton1 = document.querySelector('.close1');
var closeButton2 = document.querySelector('.close2');
var closeButton3 = document.querySelector('.close3');

var refreshClickStream = Rx.Observable.fromEvent(refreshButton, 'click').share();
var close1ClickStream = Rx.Observable.fromEvent(closeButton1, 'click');
var close2ClickStream = Rx.Observable.fromEvent(closeButton2, 'click');
var close3ClickStream = Rx.Observable.fromEvent(closeButton3, 'click');

var requestStream = refreshClickStream.startWith('startup click')
    .map(function() {
        var randomOffset = Math.floor(Math.random()*500);
        // Just so we don't max out the anonymous github api req
        // limit, I've cached a page. We'll pretend for now.
        // To really hit the API, use
        // 'https://api.github.com/users?since=' + randomOffset;
        return 'users.json'
    });

var responseStream = requestStream.flatMap(ajaxGet).share();

var suggestion1Stream = createSuggestionStream(close1ClickStream);
var suggestion2Stream = createSuggestionStream(close2ClickStream);
var suggestion3Stream = createSuggestionStream(close3ClickStream);

suggestion1Stream.subscribe(function (suggestedUser) {
    renderSuggestion(suggestedUser, '.suggestion1');
});

suggestion2Stream.subscribe(function (suggestedUser) {
    renderSuggestion(suggestedUser, '.suggestion2');
});

suggestion3Stream.subscribe(function (suggestedUser) {
    renderSuggestion(suggestedUser, '.suggestion3');
});

// Rendering ---------------------------------------------------
function renderSuggestion(suggestedUser, selector) {
    var suggestionEl = document.querySelector(selector);
    if (suggestedUser === null) {
        suggestionEl.style.visibility = 'hidden';
    } else {
        suggestionEl.style.visibility = 'visible';
        var usernameEl = suggestionEl.querySelector('.username');
        usernameEl.href = suggestedUser.html_url;
        usernameEl.textContent = suggestedUser.login;
        var imgEl = suggestionEl.querySelector('img');
        imgEl.src = "";
        imgEl.src = suggestedUser.avatar_url;
    }
}
