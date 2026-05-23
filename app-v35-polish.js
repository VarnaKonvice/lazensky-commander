function lkV35Text(selector){
  var element = document.querySelector(selector);
  return element ? element.textContent.trim().replace(/\s+/g, ' ') : '';
}
function lkV35UpperSummary(){
  var summary = document.querySelector('.full');
  var current = document.querySelector('.now2');
  if(!summary || !current) return;
  var status = lkV35Text('.now2 .pill');
  var command = lkV35Text('.now2 .cmd');
  var amount = lkV35Text('.now2 .big').replace(/([0-9])([a-zA-Zá-žÁ-Ž])/g, '$1 $2');
  var title = lkV35Text('.now2 .detail b');
  if(status === 'VOLNO'){
    if(command === 'Volno do odchodu') summary.innerHTML = 'Volno do odchodu: <b>' + amount + '</b>';
    else summary.innerHTML = 'Volno: <b>' + amount + '</b>';
    return;
  }
  if(status === 'JE ČAS VYRAZIT'){
    summary.innerHTML = 'Teď vyrazit: <b>' + title + '</b>';
    return;
  }
  if(status === 'PROBÍHÁ'){
    summary.innerHTML = 'Právě probíhá: <b>' + title + '</b>';
    return;
  }
}
function lkV35ShowNav(){
  document.body.classList.remove('nav-hidden');
}
window.addEventListener('load', function(){ setTimeout(lkV35ShowNav, 250); lkV35UpperSummary(); });
window.addEventListener('scroll', function(){ lkV35ShowNav(); }, {passive:true});
window.addEventListener('touchstart', function(){ lkV35ShowNav(); }, {passive:true});
setTimeout(function(){ lkV35ShowNav(); lkV35UpperSummary(); }, 300);
setTimeout(function(){ lkV35ShowNav(); lkV35UpperSummary(); }, 1200);
setInterval(lkV35UpperSummary, 1000);
