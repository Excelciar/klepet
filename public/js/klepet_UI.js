function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeVideo = sporocilo.indexOf('https://www.youtube.com/'); //Personal reference 2: indexOf searches for "x". If it finds it it returns the place of its first character. If it doesn't it returns -1.
  var jeSlika = sporocilo.match(new RegExp('https?:\/\/.*\.(png|gif|jpg)'));
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } 
  else if(jeVideo > -1)
  {
    
    return $('<div style="font-weight: bold"></div>' && '<div style="margin-left:20px;">').html(sporocilo);
  }
  else if (jeSlika)
  {
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } 
     
   
    
  else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}


function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = youtubeCheck(sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = managePhotos(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}
var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function youtubeCheck(x)
{
   if ((/https?:\/\/www.youtube.com\/watch\?v=\w+\b/).exec(x)!= null) //Personal reference 3: exec returns the match if it finds it. Otherwise returns null. Also in line 56, by replacing watch for v we don't give the youtube link anymore but a link straight to the video.
   {
        (/https?:\/\/www.youtube.com\/watch\?v=\w+\b/).exec(x).forEach(function(y) 
        {
        y = y.replace("watch?v=", "v/");  
        x = x + "<br><iframe src='" + y + "&output=embed' width=200px height=150px allowfullscreen /iframe>'";
     });
   }
   return x;
}

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
        
     $('#seznam-uporabnikov div').click(function() {
    $('#poslji-sporocilo').val('/zasebno "' + $(this).text() + '"');
    $('#poslji-sporocilo').focus();
  });

  socket.on('dregljaj', function() {
     $('#vsebina').jrumble();
     $('#vsebina').trigger('startRumble');
     setTimeout(function() {
       $('#vsebina').trigger('stopRumble');
     }, 1500);
   });
   
       });
  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

function managePhotos(x) //Personal reference 1. - match checks if something contains something else (takes it as a parameter). The letter at the end explains how it will work (g goes through the entire thing)
                         //RegExp makes a REGular EXPression to be used with the match function (or is it method here?)
{
   var photoID = x.match(new RegExp(/https?:\/\/\S+(.jpg|.png|.gif)/, 'g')); 
   if(photoID != null) 
   {
     var i = 0;
     while(i < photoID.length)
     {
       x = x + '<div style="margin-left: 20px;"><img src="' + photoID[i] +'" width="200px"></div>';
       i++;
     }
   }
   return x;
 } 