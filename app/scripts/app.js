(function() {
  'use strict';

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedPets: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    dump: document.getElementById('dump'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    maleNameDist: "annbsbdkdbgsdlfvspgsgerajajecdcmmkwwsemcfnakiygmsmsnaahcncyptzkatstbrjkjhnhnsbaaabmuadjlkkrirwapkbejkrytcaabsqpatbclemkjiatgmdizlwrmrrdtbhmjttmmdmondksrtksajmmchkkgfsgaactjllatlhsepkrajmsadcanecdcmrkjkkdbjtfamtrxmszsoelrvideydzltbthyajrsglajszhtdvmjtjvsfsrosckjkmddjo",
    SEX: {'m': 'MALE', 'f': 'FEMALE'},
    names: {'m': {}, 'f' : {}},
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  document.getElementById('butReload').addEventListener('click', function() {
    location.reload();
  });

  document.getElementById('butRefresh').addEventListener('click', function() {
    app.fetchData();
  });

  document.getElementById('butStart').addEventListener('click', function() {
    app.start();
  });

  document.getElementById('startchar').addEventListener('change', function() {
    app.dumpNames();
  });

  document.getElementById('butAdd').addEventListener('click', function() {
    // Open/show the add new pet dialog
    app.toggleAddDialog(true);
  });

  document.getElementById('butSave').addEventListener('click', function() {
    app.savePets(true);
  });

  document.getElementById('butAddPet').addEventListener('click', function() {
    var pet = {
      key: 'pending',
      name: document.getElementById('petName').value,
      created: Date(),
      am: '07:00:00',
      pm: '19:30:00',
      current: {
        date: '0001-01-01T00:00:00',
        feeder: 'First!',
      },
    };
    app.updatePetCard(pet);
    app.toggleAddDialog(false);
    console.log(app.selectedPets);
    app.selectedPets.push(pet);
    app.savePets(true);
  });

  document.getElementById('butAddCancel').addEventListener('click', function() {
    // Close the add new city dialog
    app.toggleAddDialog(false);
  });


  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Dump some names.
  app.dumpNames = function() {
    var sex = document.getElementById('sex').value;
    var startchar = document.getElementById('startchar').value;
    app.dump.value = 'Fetching..';
    fetch('data/' + sex + '-' + startchar + '.txt')
      .then(function(response) {
        if (response.status != 200) {
          dump.value = 'Failure: ' + response.status + ' for ' + response.url;
        } else {
          response.text().then(function(text) {
            dump.value = text;
          });
        }
      });
  };

  app.init = function() {
    // app.rng = new alea(app.data.seed);
    app.next();
    app.spinner.setAttribute('hidden', true);
  };

  app.save = function() {
    localStorage.data = JSON.stringify(app.data);
  };

  app.next = function() {

  };

  app.start = function() {
    app.spinner.removeAttribute('hidden');
    app.dump.value = "Fetching..";
    var latch = 26 * 2;
    for (let s in app.SEX) {
      for (let i = 0 ; i < 26 ; ++i) {
        let c = String.fromCharCode('a'.charCodeAt(0) + i);
        let path = '/data/' + app.SEX[s] + '-' + c + '.txt';
        fetch(path).then(function(response) {
          response.text().then(function(text) {
            app.names[s][c] = {'name' : text.split('\n') };
            app.dump.value += '\n' + latch + '(' + s + '-' + c + ')';
            if (--latch == 0) {
              app.stats();
            }
          });
        });
      }
    }
  };

  app.stats = function() {
    var stats = "";
    var largest = 0;
    for (var s in app.SEX) {
      for (var i = 0 ; i < 26 ; ++i) {
        var c = String.fromCharCode('a'.charCodeAt(0) + i);
        var n =  app.names[s][c].name.length;
        if (n > largest)
          largest = n;
      }
    }
    app.dump.value = 'Fetched.. calculating. Largest=' + largest;
    app.eratosthenes(largest * 2);
    console.log(app.sieve);
    for (var s in app.SEX) {
      for (var i = 0 ; i < 26 ; ++i) {
        var c = String.fromCharCode('a'.charCodeAt(0) + i);
        var n =  app.names[s][c].name.length;
        var p = app.getPrimes(n);
        app.names[s][c].primes = p;
        stats += '\n' + s + '-' + c + '(' + n + ')[' + p[0] + ' % ' + p[1] + ']';
      }
    }
    app.dump.value += stats;
    app.spinner.setAttribute('hidden', true);
  };

  app.eratosthenes = function(n) {
    // Eratosthenes algorithm to find all primes under n
    var array = [], upperLimit = Math.sqrt(n), output = [];

    // Make an array from 2 to (n - 1)
    for (var i = 0; i < n; i++) {
        array.push(true);
    }

    // Remove multiples of primes starting from 2, 3, 5,...
    for (var i = 2; i <= upperLimit; i++) {
        if (array[i]) {
            for (var j = i * i; j < n; j += i) {
                array[j] = false;
            }
        }
    }
    app.sieve = array;
  };

  app.getPrimes = function(n) {
    let lower = n - 1;
    let upper = n;
    for (; lower > 0; --lower) {
      if (app.sieve[lower]) {
        break;
      }
    }
    for (; upper < app.sieve.length; ++upper) {
      if (app.sieve[upper]) {
        break;
      }
    }
    return [lower, upper];
  };


  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  // Updates a pet card from the database.
  app.updatePetCard = function(data) {
    var dataLastUpdated = new Date(data.created);
    var current = data.current;
    var card = app.visibleCards[data.key];
    if (!card) {
      card = app.visibleCards['pending'];
    }
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.key] = card;
    }

    // Verifies the data provide is newer than what's already visible
    // on the card, if it's not bail, if it is, continue and update the
    // time saved in the card
    var cardLastUpdatedElem = card.querySelector('.card-last-updated');
    var cardLastUpdated = cardLastUpdatedElem.textContent;
    if (cardLastUpdated) {
      cardLastUpdated = new Date(cardLastUpdated);
      // Bail if the card has more recent data then the data
      if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
        return;
      }
    }
    cardLastUpdatedElem.textContent = data.created;

    card.querySelector('.petname').textContent = data.name;
    card.querySelector('.phase').textContent = app.phase;
    card.querySelector('.date').textContent = current.date;
    card.querySelector('.feeder').textContent = current.feeder;
    card.querySelector('.visual .icon').classList.add(app.getIconClass(current.code));

    // Replace the event listener: need to bind new data to it.
    var old_feed = card.querySelector('.visual .feed');
    var new_feed = old_feed.cloneNode(true);
    new_feed.disabled = false;
    new_feed.textContent = 'Feed ' + data.name;
    new_feed.addEventListener('click', function() {
      new_feed.disabled = true;
      app.feedPet(data, new_feed);
    });
    old_feed.parentNode.replaceChild(new_feed, old_feed);

    var today = new Date();
    today = today.getDay();
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  app.requestDone = function(request) {
    console.log(request);
    app.spinner.setAttribute('hidden', true);
    document.querySelector('.footer .stamp').textContent = Date(request.stamp);
    var message = '';
    if (request.message)
      message = request.message;
    if (request.error)
      message = request.error;
    document.querySelector('.footer .message').textContent = message;

    if (request.error) {
      app.onError(request);
    }
  };

  app.onError = function(request) {
    console.log(request);
    document.querySelector('.footer .error').textContent = 'Error';
  };

  app.setUser = function(nick, url) {
    var card = document.querySelector('.user');
    card.querySelector('.url').action = url;
    if (nick) {
      card.querySelector('.nick').textContent = nick;
      card.querySelector('.logout').removeAttribute('hidden');
      card.querySelector('.login').setAttribute('hidden', true);
    } else {
      card.querySelector('.nick').textContent = 'Logged out';
      card.querySelector('.login').removeAttribute('hidden');
      card.querySelector('.logout').setAttribute('hidden', true);
    }
  };

  app.fetchData = function() {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          app.setUser(response.nick, response.url);
          var eaterlist = []
          if (response.eaters.length == 0)
            response.message = 'All pets deleted';          
          for (var e in response.eaters) {
            eaterlist.push(response.eaters[e]);
            app.updatePetCard(response.eaters[e]);
          }
          app.selectedPets = eaterlist;
          app.savePets(false);
          app.requestDone(response);
        } else {
          app.setUser('fail - not connected?', '');
        }
      } else {
        app.setUser('Working..', '');
      }
    };
    request.open('GET', '/get');
    request.send();
  };

  app.feedPet = function(pet_data, button) {
    pet_data.current.date = new Date();
    pet_data.current.feeder = 'Me!';
    if (pet_data.key == 'pending') {
      app.updatePetCard(pet_data);
      app.savePets(true);
      console.log('Pet has a pending key..');
      return;
    }

    localStorage.selectedPets = JSON.stringify(app.selectedPets);

    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        button.disabled = false;
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          pet_data.current.feeder = response.feeder;
          app.requestDone(response);
        } else {
          app.onError(request);
        }
        app.updatePetCard(pet_data);
      }
    };
    request.open('POST', '/feed');
    request.setRequestHeader('Content-type', 'application/json');
    request.send(JSON.stringify({'pet_key' : pet_data.key}));
  };

  app.savePets = function(commit) {
    console.log('Saved commit = ' + commit);
    console.log(app.selectedPets);
    var petString = JSON.stringify(app.selectedPets);
    localStorage.selectedPets = petString;
    if (!commit)
      return;

    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);          
          app.requestDone(response);
          for (var i in app.selectedPets) {
            var oKey = app.selectedPets[i].key;
            var nKey = response.keys[i];
            if (oKey == 'pending') {
              app.selectedPets[i].key = nKey;
              app.updatePetCard(app.selectedPets[i]);
            } else if (oKey != nKey) {
              console.log('Key Sync error: ' + oKey + ' != ' + nKey);
            }
          }
          localStorage.selectedPets = JSON.stringify(app.selectedPets);
        } else {
          app.onError(request);
        }
      }
    };
    request.open('POST', '/savepets');
    request.setRequestHeader('Content-type', 'application/json');
    request.send(petString);
  };

  app.getIconClass = function(weatherCode) {
    return 'windy';
  };

  /* Sample data */
  var initialData = {
    seed: Math.random(),
    sequence: 0,
    popularCutoff: 0.1,  // 10% of names will be "popular".
    popularRatio: 0.5  // 50% of suggestions will be popular.
  };

  app.data = localStorage.data;
  if (app.data) {
    app.data = JSON.parse(app.data);
  } else {
    app.data = initialData;
  }

  app.init();
  app.save();

  // TODO add service worker code here
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }
})();
